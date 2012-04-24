(function() {
    function getColorArray(ctx) {
        var length = ctx.canvas.width;
        var height = ctx.canvas.height;
        var data = ctx.getImageData(0, 0, length, height).data;

        var colors = [];
        for (var y = 0; y < height; y++) {
            var row = [];
            for (var x = 0; x < length; x++) {
                var idx = y * length + x * 4;
                var r = data[idx];
                var g = data[idx + 1];
                var b = data[idx + 2];
                var a = data[idx + 3];
                row.push([r, g, b, a]);
            }
            colors.push(row);
        }

        return colors;
    }

    function calculateStops(colors) {
        return [];
    }

    function getCssGrad(stops, len) {
        var grad = "-webkit-linear-gradient(left," + _.map(stops, function (s) {
            var pct = Math.ceil((s.idx / len) * 100);
            var color = s.color.toRgbString();
            return color + " " + pct + "%";
        }).join(",") + ")";
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
            var colors = getColorArray(ctx);
            var stops = calculateStops(colors[0]);
            var len = img.width - 1;
            return getCssGrad(stops, len);
        };
    }
})();