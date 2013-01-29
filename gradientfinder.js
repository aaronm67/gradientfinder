(function(exports) {

    function round(num, digits) {
        digits = digits || 0;
        return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
    }

    function unique(arr, func) {
        var values = {};
        var ret = [];
        for(var i = 0, l = arr.length; i < l; ++i) {
            var val = func ? func(arr[i]) : arr[i];
            if (!values.hasOwnProperty(val)) {
                ret.push(arr[i]);
                values[val] = 1;
            }
        }
        return ret;
    }

    function flatten(arr) {
        var flat = [];
        for (var i = 0, l = arr.length; i < l; i++) {
            flat = flat.concat((arr[i].length) ? flatten(arr[i]) : arr[i]);
        }

        return flat;
    }

    // copy arr1 into arr2
    function arraycopy(arr1, arr2) {
        for (var i = 0; i < arr1.length; i++) {
            arr2[i] = arr1[i];
        }
    }

    var Color = function(arr) {
        if (typeof(arr) === "string") {
            arr = arr.split(",");
        }

        this.r = arr[0];
        this.g = arr[1];
        this.b = arr[2];

        // arr[3] == alpha - if not present, default to opaque (255)
        this.a = (arr.length === 4) ? arr[3] : 255;

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
        tolerance = (typeof(tolerance) === "undefined") ? 20 : tolerance;
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
        var aAlpha = (typeof(this.a) === 'undefined') ? 255 : this.a;
        var bAlpha = (typeof(b.a) === 'undefined') ? 255 : b.a;
        if (Math.abs(aAlpha - bAlpha) > tolerance) {
            return false;
        }

        return true;
    };

    Color.prototype.toString = function() {
        return (this.a === 255) ?
          "rgb("  + round(this.r) + ", " + round(this.g) + ", " + round(this.b) + ")" :
              "rgba(" + round(this.r) + ", " + round(this.g) + ", " + round(this.b) + ", " + round((this.a / 255), 2) + ")";
    };

    function Gradient(stops, angle, colorarray) {
        this.stops = stops;
        this.angle = angle;
        this.colorarray = colorarray;
    }

    Gradient.prototype.toCanvas = function() {
        var canvas = document.createElement("canvas");
        canvas.width = this.colorarray[0].length;
        canvas.height = this.colorarray.length;

        var context = canvas.getContext("2d");
        var data = context.createImageData(canvas.width, canvas.height);
        var graddata = flatten(this.colorarray);

        arraycopy(graddata, data.data);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.putImageData(data, 0, 0);
        return canvas;
    };

    Gradient.prototype.toCss = function() {
        if (this.stops.length === 1) {
            return "background-color: " + this.stops[0].color.toString();
        }

        // round all stops to the nearest full percent
        var stops = unique(this.stops, function(s) {
            return round(s.idx * 100);
        });
        stops = stops.map(function(s) {
            return s.color.toString() + " " + round(s.idx * 100) + "%";
        });

        var css = this.angle + "deg, " + stops.join(",");
        var w3cAngle = Math.abs(this.angle - 450) % 360;
        var w3cCss = w3cAngle + "deg, " + stops.join(",");

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
        if (arr.length === 1) {
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

    function vectorToLine(angle, length) {
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
        var endPoint = pointOfAngle(0 - angle);

        return {
            x1: startPoint.x * length,
            y1: startPoint.y * length,
            x2: endPoint.x * length,
            y2: endPoint.y * length
        };
    }

    // returns unique values from a sorted array
    function uniqueArray(arr) {
        var ret = [];
        var last;

        for (var i = 0; i < arr.length; i++) {
            if (arr[i] !== last) {
                ret.push(arr[i]);
                last = arr[i];
            }
        }
        return ret;
    }

    function getAngle(arr) {
        function getSingleColorAngles(array) {
            var ret = [];
            for (var angle = 0; angle <= 180; angle++) {
                // check to see if the entire array is the same color
                var singlearr = getSingleDimensionalArray(array, angle).map(function(a) {
                    return a.join();// convert colors to strings (sorting multidimensional arrays is SLOW)
                });
                // simple case -- the arrays are 100% identical
                if (singlearr[0] === singlearr[singlearr.length - 1]) {
                    ret.push(angle);
                }
                else {
                    // slow case -- compare all unique color values with a threshold
                    var uniquevals = uniqueArray(singlearr);
                    var first = uniquevals[0];
                    for (var i = 1; i < uniquevals.length; i++) {
                        if (!colorsEqual(first, uniquevals[i])) {
                            break;
                        }
                        else {
                            if (i === uniquevals.length - 1) {
                                ret.push(angle);
                            }
                        }
                    }
                }
            }

            return ret;
        }

        function getLikely(array, possibles) {
            var sorted = possibles.map(function(angle) {
                var grad = getSingleDimensionalArray(array, angle);
                return {
                    angle: angle,
                    stops: getStops(grad)
                };
            });
            sorted = sorted.sort(function(a, b) {
                if (a.stops.length === b.stops.length) {
                    // prioritize straight angles over diagonal
                    if (a.angle === 90 || a.angle === 0 || a.angle === -90) {
                        return -1;
                    }
                    if (b.angle === 90 || b.angle === 0 || b.angle === -90) {
                        return 1;
                    }

                    return a.angle - b.angle;
                }
                // single stops are an edge case, so de-prioritize them
                if (a.stops.length === 1) {
                    return 1;
                }
                if (b.stops.length === 1) {
                    return -1;
                }

                return a.angle - b.angle;
            });

            if (sorted.length === 0) {
                throw "Couldn't find gradient angle";
            }

            return sorted[0].angle;
        }

        var possibles = getSingleColorAngles(arr).map(function(angle) {
            return angle - 90;
        });

        var angle = getLikely(arr, possibles);
        return angle;
    }

    function getSingleDimensionalArray(arr, angle) {
        var width = arr[0].length;
        var height = arr.length;
        var multiplier = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
        var vector = vectorToLine(angle, multiplier);
        var coords = bresenhamLine(round(vector.x1), round(vector.y1), round(vector.x2), round(vector.y2));

        var ret = [];
        for (var i = 0; i < coords.length; i++) {
            var x = coords[i][0];
            var y = coords[i][1];

            if (typeof(arr[y]) !== "undefined" && typeof(arr[y][x]) !== "undefined") {
                ret.push(arr[y][x]);
            }
        }

        return ret;
    }

    // http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
    function bresenhamLine(x1, y1, x2, y2) {
        x1 = parseFloat(x1);
        y1 = parseFloat(y1);
        x2 = parseFloat(x2);
        y2 = parseFloat(y2);

        if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
            throw "Invalid coordinates for Bresenham's";
        }

        x1 = Math.round(x1);
        y1 = Math.round(y1);
        x2 = Math.round(x2);
        y2 = Math.round(y2);

        var coords = [];
        var dx = Math.abs(x2 - x1);
        var dy = Math.abs(y2 - y1);
        var sx = (x1 < x2) ? 1 : -1;
        var sy = (y1 < y2) ? 1 : -1;
        var err = dx - dy;

        coords.push([x1, y1]);
        while (!((x1 === x2) && (y1 === y2))) {
            var e2 = err * 2;
            if (e2 > -dy) {
                err -= dy;
                x1 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y1 += sy;
            }
            // Set coordinates
            coords.push([x1, y1]);
        }

        return coords;
    }

    function isStop(arr, start, end) {
        var startColor = getPixel(arr, start);
        var increment = round(arr.length / 5);
        for (var i = end; i > start; i-= increment) {
            var endColor = getPixel(arr, i);
            var average = Color.getAvg(startColor, endColor);
            var mid = getMid(arr, start, end);
            if (!average.equals(mid)) {
                return false;
            }
        }

        return true;
    }

    function getStops(arr, start, end) {
        start = start || 0;
        end = end || arr.length - 1;

        var ret = [];
        // we found a stop -- add it
        if (isStop(arr, start, end)) {
            ret.push(start);
            // we're not at the end -- search between STOP and ARR.LEN for more stops
            if (end !== arr.length - 1) {
                ret = ret.concat(getStops(arr, end, arr.length - 1));
            }
            // found a stop at the end of the array -- break out of the loop
            else if (end === arr.length - 1 && !(ret.length === 1 && getPixel(arr, 0).equals(getPixel(arr, end)))) {
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
        try {
            var angle = getAngle(arr);
            var lineArray = getSingleDimensionalArray(arr, angle);
            var stops = getStops(lineArray);
            var ret = stops.map(function(s) {
                var idx = round(s / (lineArray.length - 1), 2);
                return {
                    idx: idx,
                    color: getPixel(lineArray, s)
                };
            });

            return new Gradient(ret, angle, arr);
        } catch(e) {
            return false;
        }
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

    function fromCanvas(canvas) {
        var ctx = canvas.getContext("2d");
        var colors = getColorArray(ctx);
        var stops = calculateGradient(colors);
        return stops;
    }

    function fromUrl(url, onload) {
        var image = new Image();
        image.src = url;
        image.onload = function () {
            var img = this;
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            onload(fromCanvas(canvas));
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

    exports.GradientFinder = {
        fromUrl: fromUrl,
        fromCanvas: fromCanvas,
        colorsEqual: colorsEqual,
        Gradient: Gradient,
        Color: Color
    };
})(window);
