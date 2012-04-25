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
        return new Color([
            (a.r + b.r) / 2,
            (a.g + b.g) / 2,
            (a.b + b.b) / 2    
        ]);
    };
    Color.prototype.equals = function(b, tolerance) {
       tolerance = tolerance || 2;        
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
              "rgba(" + Math.round(this.r) + ", " + Math.round(this.g) + ", " + Math.round(this.b) + ", " + this.a + ")";    
    }

    function Gradient(stops, start, length) {
        this.stops = stops;
        this.start = start;
    }
    
    function getPixel(arr, x, y) {
        if (y === undefined) {
            return new Color(arr[x]);
        }        

        return new Color(arr[y][x]);
    }
        
    // get the middle color of a 1 dimensional array
    function getMid(arr) {
        var length = arr.length;
        if (length % 2 === 0) {
            return getPixel(arr, length / 2);
        }
        else {
            return Color.getAvg(getPixel(arr, length / 2), getPixel(image, (length / 2) - 1));
        }        
    } 
    
    function getGradientStart(arr) {
        var height = arr.length;
        var width = arr[0].length;
        var top_left = getPixel(arr, 0, 0);
        var top_right = getPixel(arr, width - 1, 0);
        var bottom_left = getPixel(arr, 0, height - 1);
        var bottom_right = getPixel(arr, width - 1, height - 1);        

        if (top_left.equals(top_right)) {
            return "top";
        }
        if (top_left.equals(bottom_left)) {
            return "left";
        }
        
        return "";
    }
    
    // convert from a 2 dimensional array to a 1 dimensional array of the gradient
    function getGradientArray(arr) {
        var height = arr.length;
        var width = arr[0].length;
    
        var top_left = getPixel(arr, 0, 0);
        var top_right = getPixel(arr, width - 1, 0);
        var bottom_left = getPixel(arr, 0, height - 1);
        var bottom_right = getPixel(arr, width - 1, height - 1);        
        
        // vertical gradient -- row[0][0] == row[0][height]
        if (top_left.equals(top_right)) {
            return arr.map(function(i) {
                return i[0];
            });
        }        
        // horizontal gradient
        if (top_left.equals(bottom_left)) {        
            return arr[0];
        }
        
        return [];        
    }
    
    function getStops(arr) {
        var stops = {};
        var start = getPixel(arr, 0);
        var end = getPixel(arr, arr.length - 1);          
        
        stops[0] = start;
        if (!start.equals(end)) {
            stops[1] = end;
        }
                
        var actualMid = getMid(arr);
        var expectedMid = Color.getAvg(start, end);
        if (actualMid.equals(expectedMid)) {
            return stops;
        }
        else {
            log("HERE, this shouldn't happen for single stop items");
        }                
        
        return [];
    }
        

    function calculateGradient(arr) {
        var ret = [];
        var mid;
        
        // 1 dimensional array to calculate gradient across;
        var grad = getGradientArray(arr);
        var direction = getGradientStart(arr);        
        var stops = getStops(grad);     
        
        
        
        
        return new Gradient(stops, direction);
                
        //if(g->start == top_left || g->start == top_right || l < 3
            //|| rgb_equal(mid, rgb_avg(tl, br))) {
            //return;
        //}

        //Now we come to the complicated part where there are more than 2 colours 
        //The good thing though is that it's either horizontal or vertical at this point
        //and that it is at least 3 pixels long in the direction of the gradient
        // So this is what we'll do.
        // - take a slice of the image from the top (or left) and see if the mid pixel matches
        // - the average of the two ends.  we start at 3 pixels.
        // - if it does, then double the size of the slice and retry (until you reach the end of the image)
        // - if it does not match, then reduce until it does match this is the first stop
        
        /*
        var len = 3;
        for (var i = 0; i < arr.length; i++) {
            var c1 = arr[0];
            var c2 = arr[len];
            if (!rgbavg(c1, c2) == mid) {
                stops.concat(return calculateGrad(arr.splice(len)));
            }            
        } */       
        
        // min = base = 0;
        // xy[0][g->start] = base;
        // max = i = 2;
        // while(i+base<l) {
            // xy[1][g->start] = i+base;
            // avg = rgb_avg(getpixel(image, xy[0][0], xy[0][1]), getpixel(image, xy[1][0], xy[1][1]));
            // if((i+base) % 2 == 0) {
                // mid = getpixel(image, (xy[1][0]+xy[0][0])/2, (xy[1][1]+xy[0][1])/2);
            // }
            // else {
                // mid = rgb_avg(
                    // getpixel(image, (xy[1][0]+xy[0][0])/2, (xy[1][1]+xy[0][1])/2),
                    // getpixel(image, (xy[1][0]+xy[0][0])/2+1, (xy[1][1]+xy[0][1])/2+1)
                // );
            // }


        // if(!rgb_equal(avg, mid)) {
            // if(min == max) {
                // min++;
                // max=i=min+2;
            // }
            // else {
                // max = i;
                // i = (i+min)/2;
            // }
        // }
        // else if(max-i<=1 && i-min<=1) {
            // We've converged 
            // if(base+i >= l-1) {
                // This is the same as the end point, so skip 
                // i++;
            // }
            // else {
                // g->ncolors++;
                // g->colors = (rgb *)realloc(g->colors, sizeof(rgb)*g->ncolors);
                // g->colors[g->ncolors-2] = getpixel(image, xy[1][0], xy[1][1]);
                // g->colors[g->ncolors-2].pos = (i+base)*100/l;

                // base += i;
                // min = 0;
                // max = i = l-base-1;
                // xy[0][g->start] = base;
            // }
        // }
        // else {
            // min = i;
            // if(i == max) {
                // i*=2;
                // if(i+base >= l)
                    // i = l-base-1;
                // max = i;
            // }
            // else {
                // i = (i+max)/2;
            // }
        // }
    // }
    // g->colors[g->ncolors-1] = br;
        return [];
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

    function getCssGrad(stops, len) {
        var grad = "-webkit-linear-gradient(left," + _.map(stops, function (s) {
            var pct = Math.ceil((s.idx / len) * 100);
            var color = s.color.toRgbString();
            return color + " " + pct + "%";
        }).join(",") + ")";
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
            var canvas = $("<canvas>")[0];
            var ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            return findGradFromCanvas(canvas);
        };
    }
    
    exports.findGrad = findGrad;    
    exports.findGradFromCanvas = findGradFromCanvas;    
    exports.getMid = getMid;
})(window);