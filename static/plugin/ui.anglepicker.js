/*
    ui.anglepicker
*/

$.widget("ui.anglepicker", $.ui.mouse, {
	widgetEventPrefix: "angle",
    _init: function () {
        this._mouseInit();
        this.pointer = $('<div class="ui-anglepicker-pointer"></div>');
        this.pointer.append('<div class="ui-anglepicker-dot"></div>');
        this.pointer.append('<div class="ui-anglepicker-line"></div>');
        
        this.element.addClass("ui-anglepicker");
        this.element.append(this.pointer);
        
        this.setDegrees(this.options.value);
    },
    _propagate: function(name, event) {
        this._trigger(name, event, this.ui());
    },
    _create: function() {
    
    },
    destroy: function () {
        this._mouseDestroy();
        
        this.element.removeClass("ui-anglepicker");
        this.pointer.remove();
    },
    _mouseStart: function (event) {
        var myOffset = this.element.offset();
        this.width = this.element.width();
        this.height = this.element.height();
        
        this.startOffset = { 
            x: myOffset.left+(this.width/2), 
            y: myOffset.top+(this.height/2) 
        };
        
        this.element.addClass("ui-anglepicker-dragging");
        this.setDegreesFromEvent(event);
        this._propagate("start", event);
    },
    _mouseStop: function (event) {
        this.element.removeClass("ui-anglepicker-dragging");
        this._propagate("stop", event);
    },
    _mouseDrag: function (event) {
        this.setDegreesFromEvent(event);
        this._propagate("change", event);
    },
	_setOption: function( key, value ) {
	
		this._super( key, value );
	},

    ui: function() {
        return {
            element: this.element,
            value: this.options.value
        };
    },
    value: function(newValue) {
    
        if ( !arguments.length ) {
            return this.options.value;
        }
        
        var oldValue = this.options.value;
        this.setDegrees(newValue);
        
        if (oldValue !== this.options.value) {
            this._propagate("change");
        }
        
        return this;
    },
    drawRotation: function() {
        var rotation = 'rotate('+-this.options.value+'deg)';
        this.pointer.css({
            '-webkit-transform': rotation,
            '-moz-transform': rotation,
            '-ms-transform': rotation,
            '-o-transform': rotation,
            'transform': rotation
        });
    },
    setDegrees: function(degrees) {
        this.options.value = this.clamp(degrees);
        this.drawRotation();
    },
    clamp: function(degrees) {
        if ( typeof degrees !== "number" ) {
            degrees = 0;
        }
        
        if(degrees === -180) {
            degrees = 180;
        }
        
        return degrees;
    },
    setDegreesFromEvent: function(event) {
        var opposite = this.startOffset.y - event.pageY,
            adjacent = event.pageX - this.startOffset.x,
            radians = Math.atan(opposite/adjacent),
            degrees = Math.round(radians * (180/Math.PI), 10);
        
        if(event.shiftKey) {
            degrees = this.roundToMultiple(degrees, 15);
        }
        else if(!event.ctrlKey) {
            degrees = this.roundToMultiple(degrees, 5);
        }
        
        if(adjacent < 0 && opposite >= 0) {
            degrees+= 180;
        }
        else if (opposite < 0 && adjacent < 0) {
            degrees-= 180;
        }
        
        this.setDegrees(degrees);
    },
    roundToMultiple: function(number, multiple) {
        var value = number/multiple,
            integer = Math.floor(value),
            rest = value - integer;
            
        return rest > 0.5 ? (integer+1)*multiple : integer*multiple;
    },
    options: {
        distance: 1,
        delay: 1,
        value: 90
    }
});

