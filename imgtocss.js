(function(exports) {    
    function Gradient(stops, start, length) {
        this.stops = stops;
        this.start = start;
    }

    function rgb_avg(a, b) {
        return {
            r: (a.r + b.r) / 2,
            g: (a.g + b.g) / 2,
            b: (a.b + b.b) / 2                            
        };
    }
    
    function rgb_equal(a, b, tol) {
        tol = tol || 2;
    
        if (Math.abs(a.r - b.r) > tol) {
            return false;
        }
        if (Math.abs(a.g - b.g) > tol) {
            return false;
        }
        if (Math.abs(a.b - b.b) > tol) {
            return false;
        }
        
        return true;
    }
    
    function arrayToRgb(arr) {
        var ret = {
            r: arr[0],
            g: arr[1],
            b: arr[2]        
        };
        
        if (arr.length == 4 && arr[3] !== 255) {
            ret.a = arr[3];
        }

        return ret;
    };
    
    function getPixel(arr, x, y) {
        return arrayToRgb(arr[y][x]);
    }

    function calculateGradient(arr) {
        var ret = [];
        var height = arr.length;
        var width = arr[0].length;                        
        var top_left = getPixel(arr, 0, 0);
        var top_right = getPixel(arr, width - 1, 0);
        var bottom_left = getPixel(arr, 0, height - 1);
        var bottom_right = getPixel(arr, width - 1, height - 1);        
      
        var grad_len;
        var grad;
        var mid;
        var grad_start;               

        // vertical gradient -- row[0][0] == row[0][height]
        if (rgb_equal(top_left, top_right)) {
            grad_start = "top";
            grad_len = height;
            if (grad_len % 2 === 0) {
                mid = getPixel(arr, 0, grad_len / 2);
            }
            else {                            
                mid = rgb_avg(getPixel(arr, 0, grad_len / 2), getPixel(image, 0, (grad_len / 2) - 1));
            }
        }
        // horizontal gradient
        else if (rgb_equal(top_left, bottom_left)) {
            grad_start = "left";
            grad_len = width;            
            if (grad_len % 2 === 0) {
                mid = getPixel(arr, grad_len / 2, 0);
            }
            else {          
                mid = rgb_avg(getPixel(arr, Math.floor(grad_len / 2), 0), getPixel(arr, Math.ceil(grad_len / 2), 0));
            }
        }
        // ltr diag
        else if(rgb_equal(top_right, bottom_left) && !rgb_equal(top_left, bottom_right)) {
            log("ltr");
            grad_start = "top_left";
            grad_len = height;
        }
        // rtl diag
        else if(rgb_equal(top_left, bottom_right) && !rgb_equal(top_right, bottom_left)) {
            log("rtl");
            grad_start = "top_right";
            grad_len = height;
            top_left = top_right;
            bottom_right = bottom_left;
        }

        var stops = {};
        stops[0] = tinycolor(top_left);
        
        if (!rgb_equal (top_left, bottom_right)) {
            stops[1] = tinycolor(bottom_right);        
        }        

        // If it's a diagonal, we only support 2 colours 
        // If it's horizontal or vertical and the middle colour is the avg of the ends, then
        // we only need two colours 
        //Also, if the image is less than 3 pixels in the direction of the gradient, then you
        //  really cannot have more than 2 colours                
        if (grad_len < 3 || rgb_equal(mid, rgb_avg(top_left, bottom_right))) {
            return new Gradient(stops, grad_start);
        }
        
        return [];
                
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
})(window);