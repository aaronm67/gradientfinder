window.log=function(){log.history=log.history||[];log.history.push(arguments);if(this.console){console.log(Array.prototype.slice.call(arguments))}};
$(function() {
    GradientFinderDemo.init();
    Samples.init();
    Generator.init();
    DefaultGrad.init();
});

var DefaultGrad = {
    init: function() {
        var grad = window.grad = {
            alphas: [ 
                [ 0, 1 ],
                [ 0.5, 0.1 ],
                [ 1, 1 ]
            ],
            colors: [ 
                [ 0, { r: 0, g: 0, b: 255, a: 1 } ],
                [ 1, { r: 0, g: 255, b: 0, a: 1 } ],
            ]        
        };
        Generator.loadFromExportable(grad);
        Generator.hardReload();
    }
};

var GradientFinderDemo = {
    init: function() {
        var opts = {
            readAsMap: {
                '.*': 'DataURL'
            },
            dragClass: "filedrop",
            on: {
                error: function() {
                    alert("You must run this on a webserver to get results");
                },
                load: function (e, file) {
                    var data = e.target.result;


                    var round = function (num, digits) {
                        digits = digits || 0;
                        return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
                    };

                    GradientFinder.Gradient.prototype.toExportable = function() {
                        return { 
                            angle: this.angle,
                            alphas: [],
                            colors: this.stops.map(function(s) {
                                return [
                                    s.idx, { r: s.color.r, g: s.color.g, b: s.color.b, a: round(s.color.a / 255, 3) }
                                ];
                            })
                        };
                    };

                    GradientFinder.fromUrl(data, function(grad) {
                        if (grad) {
                            var css = grad.toCss();
                            $("#grad").height(150);
                            $("#uploaded-image").attr("src", data);
                            $("#uploaded-image-container").show();
                            $("#error").hide();
                            Generator.loadFromExportable(grad.toExportable());
                            Generator.hardReload();
                        }
                        else {
                            $("#error").show();
                            $("#uploaded-image-container").hide();
                        }
                    });
                }
            }
        };

        $("body").fileReaderJS(opts).fileClipboard(opts);
        
        $("#applyBody").click(function() {
            if ($(this).is(":checked")) {
                GradientFinderDemo.applyToBody();
            }
            else {
                GradientFinderDemo.removeFromBody();
            }
        });
        
    },
    
    applyToBody: function() {
        Generator.applyToBody = true;
        Generator.softReload();
    },    
    removeFromBody: function() {
        Generator.applyToBody = false;
        Generator.softReload();
    }
};

// initializes GradientFinder demos
var Samples = {
    init: function() {
    var first = true;
        $("#showExamples").click(function(e) {
            e.preventDefault();
            if (first) {
                for (var i = 0; i <= 90; i+=5) {
                    $("#samples").append("<tr>" +
                        "<td>" +
                            "<img data-src='gradients/generic/" + i + ".png' />" +
                        "<td>" +
                            "<div class='preview'></div>" +
                        "</td>" +
                        "<td>" +
                        "<textarea class='css'></textarea>" +
                    "</td>");
                }

                $("#samples img").load(function(e) {
                    var img = this;
                    var canvas = document.createElement("canvas");
                    var ctx = canvas.getContext("2d");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    var grad = GradientFinder.fromCanvas(canvas);
                    if (grad) {
                        var preview = $(img).parent().siblings().find(".preview");
                        var css = $(img).parent().siblings().find(".css");
                        preview.attr("style", grad.toCss());
                        css.val(grad.toCss());
                    }
                });

                $("#samples img").attr("src", function() {
                    return $(this).data("src");
                });
            }

            first = false;
            if ($("#example-container").is(":visible")) {
                $("#example-container").hide();
                $(this).text("View");
            }
            else {
                $("#example-container").show();
                $(this).text("Hide");
            }
        });
    }
}
