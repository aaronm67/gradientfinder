var App = {};
App.onStateChange = function(c) {
    Generator.gradientPicker.gradient =  Gradient.fromExportable(c);
    Generator.hardReload();
}

App.getState = function() {
    return Generator.gradientPicker.gradient.toExportable();
}

App.undo = function() {
        UndoManager.undo();
        return false;
};
App.redo =  function() {
        UndoManager.redo();
        return false;
};
App.setGuides = function(x, y) {
    $(".guide").remove();
    var markup = [];
    for (var i = 0; i < x.length; i++) {
        markup.push(String.sprintf("<div class='guide guide-x' style='left: %dpx; '></div>", x[i]));
    }
    for (var i = 0; i < y.length; i++) {
        markup.push(String.sprintf("<div class='guide guide-y' style='top: %dpx; '></div>", y[i]));
    }
    
    $("#guides").html(markup.join(''));
};

App.getGridGuides = function() {
        var gridWidth = 60;
        var colWidth = 20;
        var numCols = 20;
        var output = [0];
        for (var i = 0; i < numCols; i++) {
            output.push((i * (colWidth + gridWidth)) + gridWidth);
        }

        return output;
};
    
var Clipboard = {
    _item: null,
    _cb: null,
    copy: function(item, cb) {
        Clipboard._item = item;
        Clipboard._cb = cb;
    },
    clear: function() {
        Clipboard._item = null;
        Clipboard._cb = null;
    },
    paste: function() {
        if (Clipboard._item) {
            var retVal = Clipboard._cb(Clipboard._item);
            return retVal === false ? false : true;
        }
        
        return false;
    }
};

var Generator = {
    gradientPicker: null,
    loadFromExportable: function(ex) {
        return Generator.gradientPicker.loadFromExportable(ex);
    },
    onPaste: function(stop) {
        Generator.gradientPicker.cloneStop(stop);
    },
    keys: function() {
        key('command+z', function(e) {
            App.undo();
            e.preventDefault();
        });
        
        key('command+shift+z', function(e) {
            App.redo();
            e.preventDefault();
        });
        key('delete, backspace', function(e) {
            var removed = Generator.gradientPicker.removeCurrentStop();
            if (removed) {
                e.preventDefault();
            }
        });
        key('⌘+c, ctrl+c', function(e) {
            var active = Generator.getActive().data("stop");
            if (active) {
                Clipboard.copy(active, Generator.onPaste);
            }
        });
        key('⌘+v, ctrl+v', function(e) {
            if (!$(e.target).is("input")) {
                var pasted = Clipboard.paste();
                if (pasted) {
                    e.preventDefault();
                }
            }
        });
        
        key('shift+left, left', function(e) {
            if (Generator.nudgeActive(e.shiftKey ? -5 : -1)) {
                e.preventDefault();
            }
        });
        key('shift+right, right', function(e) {
            if (Generator.nudgeActive(e.shiftKey ? 5 : 1)) {
                e.preventDefault();
            }
        });
    },
    getActive: function() {
        return Generator.gradientPicker.getActive();
    },
    setActive: function(c) {
        $("#copy").toggleClass("disabled", !c.length);
        Generator.gradientPicker.setActive(c);
    },
    nudgeActive: function(amount) {
        var stop = Generator.getActive().data("stop");
        if (stop) {
            stop.setOffset(stop.offset + (amount / 100));
            Generator.softReload();
            return true;
        }
    },
    init: function() {
        Generator.gradientPicker = new FreeStyle.GradientPicker($("#gradient-picker"));
        Generator.gradientPicker.addEventListener(FreeStyle.GradientPicker.Events.StateChange, function() {
            UndoManager.addState();
        })
        
        Generator.keys();
        $("#undo").click(App.undo);
        $("#redo").click(App.redo);
        
        $(document).click(function(e) {
            if ($(e.target).closest(".stop").length === 0) {
                Generator.setActive($([]));
            }
        });
        
        $("#copy").click(function() {
            if ($(this).hasClass("disabled")) { return; }
            var active = Generator.getActive().data("stop");
            if (active) {
                Clipboard.copy(active, Generator.onPaste);
            }
            return false;
        });
        $("#paste").click(function() {
            if ($(this).hasClass("disabled")) { return; }
            Clipboard.paste();
            return false;
        });
    },
    softReload: function() {
        var currentGradient = Generator.gradientPicker.gradient;
        var css = currentGradient.toCSS();
        var cssLeft = currentGradient.toCSSColor("left");
        var cssAlpha = currentGradient.toCSSAlpha("left");
        
        var rules = [
            "#trackbottom { background: " + cssLeft + "; }",
            "#tracktop .top-filler { background: " + cssAlpha + "; }"
        ];        
        if (Generator.applyToBody) {
            rules.push("body { background: " + css + " } ");
        }
              
        var fullCSS = PrefixFree.prefixCSS(rules.join(""));
        
        // Background CSS doesn't use PrefixFree, as this is text meant to be copy/pasted
        var w3cCss = currentGradient.toW3cCSS();

        var backgroundCss = "background: -webkit-" + css + ";\n" +
            "background: -o-" + css + ";\n" +
            "background: -ms-" + css + ";\n" +
            "background: -moz-" + css + ";\n" +
            "background: " + w3cCss + ";\n";

        $("#grad").val(backgroundCss);
        $("#filedropper").attr("style", backgroundCss);
        $("#custom-style").html(fullCSS);
        $("#anglepicker").anglepicker("value", Generator.gradientPicker.getAngle());
        $("#current-angle").val(Generator.gradientPicker.getAngle());
        
        var barWidth = $("#track").width();
        var tabindex = 1;
        $(".stop").each(function() {
            var left = Math.round(($(this).data("stop").getOffset() * barWidth) - $(this).outerWidth(true) / 2);
            $(this).css({ left: left + "px" });
            
            var sliderHandle = $(this).find(".ui-slider-handle");
            if (sliderHandle.length) {
                sliderHandle.attr("stop-tabindex", tabindex++);
            }
            $(this).attr("stop-tabindex", tabindex++);
            
            var offset = $(this).data("stop").offset || 0;
            $(this).find(".label-offset").text(Math.round(offset * 100) + "%");
        });
    },
    hardReload: function() {
        Generator.gradientPicker.hardReload();
    }
};