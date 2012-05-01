(function(exports) {
    var Color = function(arr) {
        this.r = arr[0];
        this.g = arr[1];
        this.b = arr[2];
        if (arr.length == 4) {
            this.a = (arr[3] / 255);
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
       tolerance = tolerance || 5;
        if (Math.abs(this.r - b.r) > tolerance) {
            return false;
        }
        if (Math.abs(this.g - b.g) > tolerance) {
            return false;
        }
        if (Math.abs(this.b - b.b) > tolerance) {
            return false;
        }
        return true;
    };

    Color.prototype.toString = function() {
        return (this.a == 1) ?
          "rgb("  + Math.round(this.r) + ", " + Math.round(this.g) + ", " + Math.round(this.b) + ")" :
              "rgba(" + Math.round(this.r) + ", " + Math.round(this.g) + ", " + Math.round(this.b) + ", " + (Math.round(this.a * 100) / 100) + ")";
    };

    function Gradient(stops, start, length) {
        this.stops = stops;
        this.start = start;
    }

    
    Gradient.prototype.toCss = function() {
        var stops = this.stops.map(function(s) {
            return s.color.toString() + " " + Math.round(s.idx * 100) + "%";
        });
        var css = this.start + ", " + stops.join(",");
        return "background: -webkit-linear-gradient(" + css + ");" +
                "background: -o-linear-gradient(" + css + ");" +
                "background: -ms-linear-gradient(" + css + ");" +
                "background: -moz-linear-gradient(" + css + ");" +
                "background: -webkit-linear-gradient(" + css + ");" +
                "background: linear-gradient(" + css + ");";
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

    // convert from a 2 dimensional array to a 1 dimensional array of the gradient
    function getGradientObj(arr) {
        var height = arr.length;
        var width = arr[0].length;

        var top_left = getPixel(arr, 0, 0);
        var top_right = getPixel(arr, width - 1, 0);
        var bottom_left = getPixel(arr, 0, height - 1);
        var bottom_right = getPixel(arr, width - 1, height - 1);

        // vertical gradient -- row[0][0] == row[0][height]
        if (top_left.equals(top_right)) {
            return {
                start: "top",
                arr: arr.map(function(i) {
                    return i[0];
                })
            };
        }
        // horizontal gradient
        if (top_left.equals(bottom_left)) {
            return {
                start: "left",
                arr: arr[0]
            }
        }

        return [];
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
        var ret = [];
        var gradobj = getGradientObj(arr);
        var stops = getStops(gradobj.arr);
        var ret = stops.map(function(s) {
            var idx = s / (gradobj.arr.length - 1);
            return {
                idx: idx,
                color: getPixel(gradobj.arr, s)
            }
        });

        return new Gradient(ret, gradobj.start);
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

    function findGrad(dataurl) {
        var image = new Image();
        image.src = dataurl;
        image.onload = function () {
            var img = this;
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            return findGradFromCanvas(canvas);
        };
    }
    
    function colorsEqual(c1, c2) {
        return new Color(c1).equals(new Color(c2));
    }

    exports.GradientCalc = {
        findGrad: findGrad,
        findGradFromCanvas: findGradFromCanvas,
        colorsEqual: colorsEqual
    };
})(window);