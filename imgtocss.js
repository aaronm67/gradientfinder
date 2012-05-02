(function(exports) {
    function round(num, digits) {
        digits = digits || 0;
        return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
    }

    var Color = function(arr) {
        this.r = arr[0];
        this.g = arr[1];
        this.b = arr[2];
        if (arr.length == 4) {
            this.a = round(arr[3] / 255, 2)
        }
        if (typeof(this.r) === 'undefined' || typeof(this.g) === 'undefined' || typeof(this.b) === 'undefined') {
            throw "Invalid Color Array passed in";
        }
        
    };

    Color.getAvg = function(a, b) {
        var color = [
            (a.r + b.r) / 2,
            (a.g + b.g) / 2,
            (a.b + b.b) / 2
        ];
        if ((typeof(a.a) !== 'undefined') || typeof(b.a !== 'undefined')) {
            a.a = (typeof a.a === 'undefined') ? 255 : a.a;
            b.a = (typeof b.a === 'undefined') ? 255 : b.a;
            color.push((a.a + b.a) / 2);
        }

        return new Color(color);
    };

    Color.prototype.equals = function(b, tolerance) {
       tolerance = tolerance || 4;
        if (Math.abs(this.r - b.r) > tolerance) {
            return false;
        }
        if (Math.abs(this.g - b.g) > tolerance) {
            return false;
        }
        if (Math.abs(this.b - b.b) > tolerance) {
            return false;
        }
        // compare alphas -- treat undefined alpha as opaque
        var aAlpha = (typeof(this.a) === 'undefined') ? 1 : this.a;
        var bAlpha = (typeof(b.a) === 'undefined') ? 1 : b.a;        
        var aTolerance = .3;
        if (Math.abs(aAlpha - bAlpha) > tolerance) {
            return false;
        }

        return true;
    };

    Color.prototype.toString = function() {
        return (this.a == 1) ?
          "rgb("  + round(this.r) + ", " + round(this.g) + ", " + round(this.b) + ")" :
              "rgba(" + round(this.r) + ", " + round(this.g) + ", " + round(this.b) + ", " + round(this.a, 2) + ")";
    };

    function Gradient(stops, angle, length) {
        this.stops = stops;
        this.angle = angle;
    }
    
    Gradient.prototype.toCss = function() {
        if (this.stops.length === 1) {
            return "background-color: " + s.color.toString();
        }
        
        var stops = this.stops.map(function(s) {
            return s.color.toString() + " " + round(s.idx * 100) + "%";
        });
        
        var css = this.angle + "deg, " + stops.join(",");
        return "background: -webkit-linear-gradient(" + css + ");\n" +
                "background: -o-linear-gradient(" + css + ");\n" +
                "background: -ms-linear-gradient(" + css + ");\n" +
                "background: -moz-linear-gradient(" + css + ");\n" +
                "background: linear-gradient(" + css + ");\n";
    };

    function getPixel(arr, x, y) {
        if (y === undefined) {
            return new Color(arr[x]);
        }

        return new Color(arr[y][x]);
    }

    // get the middle color of a 1 dimensional array
    function getMid(arr, start, end) {
        if (arr.length == 1) {
            return new Color(arr[0]);
        }

        start = start || 0;
        end = (end || arr.length) - start;
        arr = arr.slice(start);

        if (end % 2 === 0) {
            return getPixel(arr, end / 2);
        }
        else {
            return Color.getAvg(getPixel(arr, Math.floor(end / 2)), getPixel(arr, Math.ceil(end / 2)));
        }
    }

    function angleToVector(angle) {
        function pointOfAngle(a) {
            function toRads(d) {
                return (d * Math.PI) / 180;
            }
            return {
                x: Math.max(Math.cos(toRads(a)), 0),
                y: Math.max(Math.sin(toRads(a)), 0)
            };
        }

        angle = angle % 360;
        var startPoint = pointOfAngle(180 - angle);
        var endPoint = pointOfAngle(360 - angle);
        return {
            x1: startPoint.x,
            y1: startPoint.y,
            x2: endPoint.x,
            y2: endPoint.y
        };
    }

    function arraysEqual(a, b) {
        if (!a || !b || !a.length || !b.length) {
            return false;
        }

        if (a.length != b.length) { return false; }
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

    function getAngle(arr) {
        function getSingleColorAngles(arr) {
            var ret = [];
            for (var angle = 0; angle <= 179; angle++) {
                var singlearr = getSingleDimensionalArray(arr, angle);
                var sameColor = true;
                singlearr = singlearr.sort();
                if (singlearr && arraysEqual(singlearr[0], singlearr[singlearr.length - 1])) {
                    ret.push(angle);
                }
            }

            return ret;
        }

        var possibles = getSingleColorAngles(arr);
        return possibles[0] - 90;
    }
    
    function getSingleDimensionalArray(arr, angle) {
        var width = arr[0].length;
        var height = arr.length;
        var vector = angleToVector(angle);   
        var maxLen = Math.sqrt( Math.pow(vector.x2 * width, 2) + Math.pow(vector.y2 * width, 2));
        var ret = [];
        for (var len = 0; len < maxLen; len++) {
            var x = Math.round(vector.x2 * len);
            var y = Math.round(vector.y2 * len);
            if (x < width && y < height) {
                ret.push(arr[x][y]);
            }
        }

        return ret;
    }

    // convert from a 2 dimensional array to a 1 dimensional array of the gradient
    function getGradientObj(arr) {
        var angle = getAngle(arr);
        return {
            angle: angle,
            arr: getSingleDimensionalArray(arr, angle)
        }

        throw "Couldn't find a gradient angle";
    }

    function getStops(arr, start, end) {
        var ret = [];
        start = start || 0;
        end = end || arr.length - 1;

        var startColor = getPixel(arr, start);
        var endColor = getPixel(arr, end);
        var average = Color.getAvg(startColor, endColor)
        var mid = getMid(arr, start, end);

        // we found a stop -- add it
        if (average.equals(mid)) {
            ret.push(start);

            // we're not at the end -- search between STOP and ARR.LEN for more stops
            if (end != arr.length - 1) {
                ret = ret.concat(getStops(arr, end, arr.length - 1));
            }
            // found a stop at the end of the array -- break out of the loop
            else if (end == arr.length - 1 && !startColor.equals(endColor)) {
                ret.push(end);                                
            }
        }
        // no stop found -- try again
        else {
            ret = ret.concat(getStops(arr, start, end - 1));
        }

        return ret;
    }

    function calculateGradient(arr) {
        var gradobj = getGradientObj(arr);
        var stops = getStops(gradobj.arr);
        var ret = stops.map(function(s) {
            var idx = round(s / (gradobj.arr.length - 1), 2);
            return {
                idx: idx,
                color: getPixel(gradobj.arr, s)
            }
        });

        return new Gradient(ret, gradobj.angle);
    }

    function getColorArray(ctx) {
        var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        var width = imageData.width;
        var height = imageData.height;
        var data = imageData.data;

        var colors = [];
        for (var y = 0; y < height; y++) {
            var row = [];
            for (var x = 0; x < width; x++) {
                var idx = ((width * y) + x) * 4;
                var r = data[idx];
                var g = data[idx + 1];
                var b = data[idx + 2];
                var a = data[idx + 3];
                row.push([r, g, b, a]);
            }

            colors[y] = row;
        }

        return colors;
    }

    function findGradFromCanvas(canvas) {
        var ctx = canvas.getContext("2d");
        var colors = getColorArray(ctx);
        var stops = calculateGradient(colors);
        return stops;
    }

    function findGrad(dataurl, onload) {
        var image = new Image();
        image.src = dataurl;
        image.onload = function () {
            var img = this;
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            onload(findGradFromCanvas(canvas));
        };
    }
    
    function colorsEqual(c1, c2) {
        var color1 = c1;
        var color2 = c2;
        if (c1.length) {
            color1 = new Color(c1);
        }
        if (c2.length) {
            color2 = new Color(c2);
        }

        return Color.prototype.equals.apply(color1, [color2]);
    }

    exports.GradientCalc = {
        findGrad: findGrad,
        findGradFromCanvas: findGradFromCanvas,
        colorsEqual: colorsEqual
    };
})(window);