var ImageEditorJS = window.ImageEditorJS || {};

ImageEditorJS = (function() {

    function ImageEditor() {

        var _wrapper, _canvas, _image, _cropBox, _options;

        function _crop(options) {
            _options = options;
            _wrapper = options.wrapper;
            _canvas = document.createElement('canvas');
            _image = document.createElement('img');
            _image.src = options.src;
            _image.onload = _onImageLoaded;
            _wrapper.appendChild(_image);
            _wrapper.appendChild(_canvas);

            _canvas.style = "position: absolute;left: 0;right: 0;top: 0;bottom: 0;margin: auto; max-width:100%; max-height:100%;";
            _image.style = "position: absolute;left: 0;right: 0;top: 0;bottom: 0;margin: auto; max-width:100%; max-height:100%;";
            _wrapper.style.position = "relative";
        }

        function _onImageLoaded() {
            // _pack();
            _canvas.height = _image.height;
            _canvas.width = _image.width;
            _cropBox = new CropBox({
                container_w: _canvas.width,
                container_h: _canvas.height,
                image_w: _image.naturalWidth, //original size
                image_h: _image.naturalHeight,
                ctx: _canvas.getContext('2d'),
                image: _image,
                ratio: _options.ratio || null,
                previewCanvas: _options.previewCanvas || null,
                boxSize: _options.boxSize || [0, 0, "50%", "50%"]
            });
            _bindCanvasEvents();
            _drawCropBox();

        }

        //Deprecated. use max-width and max-height instead.
        function _pack() {
            var wrapperStyle, wrapper_w, wrapper_h, wrapper_ratio;
            wrapperStyle = document.defaultView.getComputedStyle(_wrapper);
            wrapper_w = Number.parseInt(wrapperStyle.width);
            wrapper_h = Number.parseInt(wrapperStyle.height);
            wrapper_ratio = wrapper_w / wrapper_h;
            if (wrapper_ratio > _image.naturalWidth / _image.naturalHeight) {
                if (_image.naturalHeight > wrapper_h) {
                    _image.style.height = "100%";
                }
            } else {
                if (_image.naturalWidth > wrapper_w) {
                    _image.style.width = "100%";
                }
            }
        }

        function _drawCropBox() {
            _cropBox.clearCanvas();
            _cropBox.draw();
        }


        function _bindCanvasEvents() {
            _canvas.onmousedown = _onMouseDownCanvas;
            _canvas.onmousemove = _onMouseMoveCanvas;
            _canvas.onmouseup = _onMouseUpCanvas;
            _canvas.onmouseout = _onMouseUpCanvas;
        }

        function _onMouseUpCanvas(e) {
            _cropBox.resetStatus();
        }

        function _onMouseMoveCanvas(e) {
            _cropBox.movable(e.offsetX, e.offsetY);
            _cropBox.onHoverDragPoint(e.offsetX, e.offsetY);
            _cropBox.dragable(e.offsetX, e.offsetY);
            _drawCropBox();
        }

        function _onMouseDownCanvas(e) {
            _cropBox.calculateInnerMouseOffset(e.offsetX, e.offsetY);
            _cropBox.checkOnHoverDragPoint(e.offsetX, e.offsetY);
            _cropBox.checkMovable(e.offsetX, e.offsetY);
            _cropBox.checkResizable();
        }

        function _getCropResult() {
            if (_cropBox) {
                return _cropBox.getCropResult();
            }
        }

        function _getCropCanvas() {
            if (_cropBox) {
                return _cropBox.getCropCanvas();
            }
        }

        return {
            crop: _crop,
            getCropResult: _getCropResult,
            getCropCanvas: _getCropCanvas
        }
    }


    function CropBox(options) {
        this.image = options.image;
        this.previewCanvas = options.previewCanvas;

        this.container_w = options.container_w;
        this.container_h = options.container_h;
        this.image_w = options.image.naturalWidth;
        this.image_h = options.image.naturalHeight;
        this.ctx = options.ctx;
        this.currMouseOffsetX = options.x;
        this.currMouseOffsetY = options.y;
        this.ratio = options.ratio;

        this.dragPointSize = options.dragPointSize || 6;
        this.dragPointHoverSize = options.dragPointHoverSize || 10;

        this.isDragPointOnHover = [false, false, false, false, false, false, false, false];
        this.dragPointsSize = [this.dragPointSize, this.dragPointSize, this.dragPointSize, this.dragPointSize, this.dragPointSize, this.dragPointSize, this.dragPointSize, this.dragPointSize];
        this.isResizable = [false, false, false, false, false, false, false, false];
        this.isMovable = false;

        this.ratioX = this.image_w / this.container_w;
        this.ratioY = this.image_h / this.container_h;


        this.x = options.boxSize[0];
        this.y = options.boxSize[1];
        this.w = options.boxSize[2];
        this.h = options.boxSize[3];

        if (this.w.indexOf('%') !== -1) {
            this.w = Number.parseInt(this.w) * this.container_w / 100;
        }
        if (this.h.indexOf('%') !== -1) {
            this.h = Number.parseInt(this.h) * this.container_h / 100;
        }

        this.setCropResult({
            x: this.x * this.ratioX,
            y: this.y * this.ratioY,
            w: this.w * this.ratioX,
            h: this.h * this.ratioY
        });

    }

    CropBox.prototype.draw = function() {

        //control crop boundary.
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x > (this.image.width - this.w)) {
            this.x = (this.image.width - this.w);
        }
        if (this.y < 0) {
            this.y = 0;
        } else if (this.y > (this.image.height - this.h)) {
            this.y = (this.image.height - this.h);
        }
        if (this.w > this.image.width) {
            this.w = this.image.width;
        }
        if (this.h > this.image.height) {
            this.h = this.image.height;
        }

        this.ctx.strokeStyle = '#1a59b4';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(this.x, this.y, this.w, this.h);
        this.ctx.drawImage(this.image, this.x * this.ratioX, this.y * this.ratioY, this.w * this.ratioX, this.h * this.ratioY, this.x, this.y, this.w, this.h);
        this.setCropResult({
            x: this.x * this.ratioX,
            y: this.y * this.ratioY,
            w: this.w * this.ratioX,
            h: this.h * this.ratioY
        });
        this.updatePreviewCanvas();
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.x - this.dragPointsSize[0], this.y - this.dragPointsSize[0], this.dragPointsSize[0] * 2, this.dragPointsSize[0] * 2);
        this.ctx.fillRect(this.x + this.w - this.dragPointsSize[1], this.y - this.dragPointsSize[1], this.dragPointsSize[1] * 2, this.dragPointsSize[1] * 2);
        this.ctx.fillRect(this.x + this.w - this.dragPointsSize[2], this.y + this.h - this.dragPointsSize[2], this.dragPointsSize[2] * 2, this.dragPointsSize[2] * 2);
        this.ctx.fillRect(this.x - this.dragPointsSize[3], this.y + this.h - this.dragPointsSize[3], this.dragPointsSize[3] * 2, this.dragPointsSize[3] * 2);
        this.ctx.fillRect(this.x + this.w - this.dragPointsSize[4], this.y + this.h / 2 - this.dragPointsSize[4], this.dragPointsSize[4] * 2, this.dragPointsSize[4] * 2);
        this.ctx.fillRect(this.x + this.w / 2 - this.dragPointsSize[5], this.y - this.dragPointsSize[5], this.dragPointsSize[5] * 2, this.dragPointsSize[5] * 2);
        this.ctx.fillRect(this.x + this.w / 2 - this.dragPointsSize[6], this.y + this.h - this.dragPointsSize[6], this.dragPointsSize[6] * 2, this.dragPointsSize[6] * 2);
        this.ctx.fillRect(this.x - this.dragPointsSize[7], this.y + this.h / 2 - this.dragPointsSize[7], this.dragPointsSize[7] * 2, this.dragPointsSize[7] * 2);

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 0.6;
        this.ctx.setLineDash([5, 5]);
        this.ctx.moveTo(this.x + this.w / 3, this.y);
        this.ctx.lineTo(this.x + this.w / 3, this.y + this.h);
        this.ctx.stroke();

        this.ctx.moveTo(this.x + this.w / 3 * 2, this.y);
        this.ctx.lineTo(this.x + this.w / 3 * 2, this.y + this.h);
        this.ctx.stroke();

        this.ctx.moveTo(this.x, this.y + this.h / 3);
        this.ctx.lineTo(this.x + this.w, this.y + this.h / 3);
        this.ctx.stroke();

        this.ctx.moveTo(this.x, this.y + this.h / 3 * 2);
        this.ctx.lineTo(this.x + this.w, this.y + this.h / 3 * 2);
        this.ctx.stroke();

    }

    CropBox.prototype.movable = function(mouse_offsetX, mouse_offsetY) {

        var currMouseX = Math.floor(mouse_offsetX);
        var currMouseY = Math.floor(mouse_offsetY);
        this.ctx.canvas.style.cursor = "default";

        if (this.isMovable) {
            this.x = currMouseX - this.currMouseOffsetX;
            this.y = currMouseY - this.currMouseOffsetY;
            this.ctx.canvas.style.cursor = "move";
        }
    };

    CropBox.prototype.onHoverDragPoint = function(mouse_offsetX, mouse_offsetY) {


        var currMouseX = Math.floor(mouse_offsetX);
        var currMouseY = Math.floor(mouse_offsetY);

        for (i = 0; i < 8; i++) {
            this.isDragPointOnHover[i] = false;
            this.dragPointsSize[i] = this.dragPointSize;
        }

        if (currMouseX > this.x - this.dragPointHoverSize && currMouseX < this.x + this.dragPointHoverSize &&
            currMouseY > this.y - this.dragPointHoverSize && currMouseY < this.y + this.dragPointHoverSize) {

            this.isDragPointOnHover[0] = true;
            this.dragPointsSize[0] = this.dragPointHoverSize;
            this.ctx.canvas.style.cursor = "nw-resize";
        }
        if (currMouseX > this.x + this.w - this.dragPointHoverSize && currMouseX < this.x + this.w + this.dragPointHoverSize &&
            currMouseY > this.y - this.dragPointHoverSize && currMouseY < this.y + this.dragPointHoverSize) {

            this.isDragPointOnHover[1] = true;
            this.dragPointsSize[1] = this.dragPointHoverSize;
            this.ctx.canvas.style.cursor = "ne-resize";
        }
        if (currMouseX > this.x + this.w - this.dragPointHoverSize && currMouseX < this.x + this.w + this.dragPointHoverSize &&
            currMouseY > this.y + this.h - this.dragPointHoverSize && currMouseY < this.y + this.h + this.dragPointHoverSize) {

            this.isDragPointOnHover[2] = true;
            this.dragPointsSize[2] = this.dragPointHoverSize;
            this.ctx.canvas.style.cursor = "se-resize";
        }
        if (currMouseX > this.x - this.dragPointHoverSize && currMouseX < this.x + this.dragPointHoverSize &&
            currMouseY > this.y + this.h - this.dragPointHoverSize && currMouseY < this.y + this.h + this.dragPointHoverSize) {

            this.isDragPointOnHover[3] = true;
            this.dragPointsSize[3] = this.dragPointHoverSize;
            this.ctx.canvas.style.cursor = "sw-resize";
        }

        if (currMouseX > this.x + this.w - this.dragPointHoverSize && currMouseX < this.x + this.w + this.dragPointHoverSize &&
            currMouseY > this.y + this.h / 2 - this.dragPointHoverSize && currMouseY < this.y + this.h / 2 + this.dragPointHoverSize) {

            this.isDragPointOnHover[4] = true;
            this.dragPointsSize[4] = this.dragPointHoverSize;
            this.ctx.canvas.style.cursor = "e-resize";
        }

        if (currMouseX > this.x + this.w / 2 - this.dragPointHoverSize && currMouseX < this.x + this.w / 2 + this.dragPointHoverSize &&
            currMouseY > this.y - this.dragPointHoverSize && currMouseY < this.y + this.dragPointHoverSize) {

            this.isDragPointOnHover[5] = true;
            this.dragPointsSize[5] = this.dragPointHoverSize;
            this.ctx.canvas.style.cursor = "n-resize";
        }
        if (currMouseX > this.x + this.w / 2 - this.dragPointHoverSize && currMouseX < this.x + this.w / 2 + this.dragPointHoverSize &&
            currMouseY > this.y + this.h - this.dragPointHoverSize && currMouseY < this.y + this.h + this.dragPointHoverSize) {

            this.isDragPointOnHover[6] = true;
            this.dragPointsSize[6] = this.dragPointHoverSize;
            this.ctx.canvas.style.cursor = "s-resize";
        }
        if (currMouseX > this.x - this.dragPointHoverSize && currMouseX < this.x + this.dragPointHoverSize &&
            currMouseY > this.y + this.h / 2 - this.dragPointHoverSize && currMouseY < this.y + this.h / 2 + this.dragPointHoverSize) {

            this.isDragPointOnHover[7] = true;
            this.dragPointsSize[7] = this.dragPointHoverSize;
            this.ctx.canvas.style.cursor = "w-resize";
        }
    };

    CropBox.prototype.dragable = function(mouse_offsetX, mouse_offsetY) {
        var currMouseX = Math.floor(mouse_offsetX);
        var currMouseY = Math.floor(mouse_offsetY);
        //TODO refactoring
        var drag_X, drag_Y, drag_W, drag_H;

        if (this.ratio) {

            if (this.isResizable[0] || this.isResizable[5] || this.isResizable[7]) {
                drag_X = currMouseX - this.currMouseOffsetX;
                drag_Y = currMouseY - this.currMouseOffsetY;
                drag_W = this.w + this.x - drag_X;
                drag_H = this.h + this.y - drag_Y;

                if (drag_W / drag_H < this.ratio) {
                    drag_X = this.w + this.x - drag_H * this.ratio;
                    drag_Y = currMouseY - this.currMouseOffsetY;
                    drag_W = this.w + this.x - drag_X;
                    drag_H = this.h + this.y - drag_Y;
                } else {
                    drag_X = currMouseX - this.currMouseOffsetX;
                    drag_Y = this.h + this.y - drag_W / this.ratio;
                    drag_W = this.w + this.x - drag_X;
                    drag_H = this.h + this.y - drag_Y;
                }
            }

            if (this.isResizable[2] || this.isResizable[4] || this.isResizable[6]) {
                drag_X = this.x;
                drag_Y = this.y;
                drag_W = currMouseX - this.currMouseOffsetX - drag_X;
                drag_H = currMouseY - this.currMouseOffsetY - drag_Y;
                if (drag_W / drag_H < this.ratio) {
                    drag_W = drag_H * this.ratio;
                } else {
                    drag_H = drag_W / this.ratio;
                }
            }

            if (this.isResizable[1]) {
                drag_X = this.x;
                drag_Y = currMouseY - this.currMouseOffsetY;
                drag_W = currMouseX - this.currMouseOffsetX - drag_X;
                drag_H = this.h + this.y - drag_Y;
                if (drag_W / drag_H < this.ratio) {
                    drag_W = drag_H * this.ratio;
                } else {
                    drag_H = drag_W / this.ratio;
                }
            }

            if (this.isResizable[3]) {
                drag_X = currMouseX - this.currMouseOffsetX;
                drag_Y = this.y;
                drag_W = this.w + this.x - drag_X;
                drag_H = currMouseY - this.currMouseOffsetY - drag_Y;
                if (drag_W / drag_H < this.ratio) {
                    drag_W = drag_H * this.ratio;
                } else {
                    drag_H = drag_W / this.ratio;
                }
            }

        } else {

            if (this.isResizable[0]) {
                drag_X = currMouseX - this.currMouseOffsetX;
                drag_Y = currMouseY - this.currMouseOffsetY;
                drag_W = this.w + this.x - drag_X;
                drag_H = this.h + this.y - drag_Y;
                this.ctx.canvas.style.cursor = "nw-resize";
            }
            if (this.isResizable[1]) {
                drag_X = this.x;
                drag_Y = currMouseY - this.currMouseOffsetY;
                drag_W = currMouseX - this.currMouseOffsetX - drag_X;
                drag_H = this.h + this.y - drag_Y;
                this.ctx.canvas.style.cursor = "ne-resize";
            }
            if (this.isResizable[2]) {
                drag_X = this.x;
                drag_Y = this.y;
                drag_W = currMouseX - this.currMouseOffsetX - drag_X;
                drag_H = currMouseY - this.currMouseOffsetY - drag_Y;
                this.ctx.canvas.style.cursor = "se-resize";
            }
            if (this.isResizable[3]) {
                drag_X = currMouseX - this.currMouseOffsetX;
                drag_Y = this.y;
                drag_W = this.w + this.x - drag_X;
                drag_H = currMouseY - this.currMouseOffsetY - drag_Y;
                this.ctx.canvas.style.cursor = "sw-resize";
            }

            if (this.isResizable[4]) {
                drag_X = this.x;
                drag_Y = this.y;
                drag_W = currMouseX - this.currMouseOffsetX - drag_X;
                drag_H = this.h;
                this.ctx.canvas.style.cursor = "e-resize";
            }
            if (this.isResizable[5]) {
                drag_X = this.x;
                drag_Y = currMouseY - this.currMouseOffsetY;
                drag_W = this.w;
                drag_H = this.h + this.y - drag_Y;
                this.ctx.canvas.style.cursor = "n-resize";
            }
            if (this.isResizable[6]) {
                drag_X = this.x;
                drag_Y = this.y;
                drag_W = this.w;
                drag_H = currMouseY - this.currMouseOffsetY - drag_Y;
                this.ctx.canvas.style.cursor = "s-resize";
            }
            if (this.isResizable[7]) {
                drag_X = currMouseX - this.currMouseOffsetX;
                drag_Y = this.y;
                drag_W = this.w + this.x - drag_X;
                drag_H = this.h;
                this.ctx.canvas.style.cursor = "w-resize";
            }
        }


        if (drag_W > this.dragPointHoverSize * 2 && drag_H > this.dragPointHoverSize * 2) {
            this.w = drag_W;
            this.h = drag_H;

            this.x = drag_X;
            this.y = drag_Y;
        }
    };

    CropBox.prototype.checkMovable = function(mouse_offsetX, mouse_offsetY) {
        var currMouseX = Math.floor(mouse_offsetX);
        var currMouseY = Math.floor(mouse_offsetY);
        if (currMouseX > this.x + this.dragPointHoverSize && currMouseX < this.x + this.w - this.dragPointHoverSize &&
            currMouseY > this.y + this.dragPointHoverSize && currMouseY < this.y + this.h - this.dragPointHoverSize) {
            this.isMovable = true;
        }
    };

    CropBox.prototype.checkOnHoverDragPoint = function(mouse_offsetX, mouse_offsetY) {
        var currMouseX = Math.floor(mouse_offsetX);
        var currMouseY = Math.floor(mouse_offsetY);
        if (this.isDragPointOnHover[0]) {
            this.currMouseOffsetX = currMouseX - this.x;
            this.currMouseOffsetY = currMouseY - this.y;
        }
        if (this.isDragPointOnHover[1]) {
            this.currMouseOffsetX = currMouseX - this.x - this.w;
            this.currMouseOffsetY = currMouseY - this.y;
        }
        if (this.isDragPointOnHover[2]) {
            this.currMouseOffsetX = currMouseX - this.x - this.w;
            this.currMouseOffsetY = currMouseY - this.y - this.h;
        }
        if (this.isDragPointOnHover[3]) {
            this.currMouseOffsetX = currMouseX - this.x;
            this.currMouseOffsetY = currMouseY - this.y - this.h;
        }

        if (this.isDragPointOnHover[4]) {
            this.currMouseOffsetX = currMouseX - this.x - this.w;
            this.currMouseOffsetY = currMouseY - this.y - this.h / 2;
        }
        if (this.isDragPointOnHover[5]) {
            this.currMouseOffsetX = currMouseX - this.x - this.w / 2;
            this.currMouseOffsetY = currMouseY - this.y;
        }
        if (this.isDragPointOnHover[6]) {
            this.currMouseOffsetX = currMouseX - this.x - this.w / 2;
            this.currMouseOffsetY = currMouseY - this.y - this.h;
        }
        if (this.isDragPointOnHover[7]) {
            this.currMouseOffsetX = currMouseX - this.x;
            this.currMouseOffsetY = currMouseY - this.y - this.h / 2;
        }

    };

    CropBox.prototype.checkResizable = function() {

        for (i = 0; i < 8; i++) {
            if (this.isDragPointOnHover[i]) {
                this.isResizable[i] = true;
            }
        }
    };

    CropBox.prototype.calculateInnerMouseOffset = function(mouse_offsetX, mouse_offsetY) {
        var currMouseX = Math.floor(mouse_offsetX);
        var currMouseY = Math.floor(mouse_offsetY);
        this.currMouseOffsetX = currMouseX - this.x;
        this.currMouseOffsetY = currMouseY - this.y;
    };

    CropBox.prototype.clearCanvas = function() {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    };

    CropBox.prototype.resetStatus = function() {
        this.isMovable = false;

        for (i = 0; i < 8; i++) {
            this.isResizable[i] = false;
        }
        this.currMouseOffsetX = 0;
        this.currMouseOffsetY = 0;
    };

    CropBox.prototype.setCropResult = function(cropResult) {

        this.cropResult = cropResult;
    };

    CropBox.prototype.getCropResult = function() {
        return this.cropResult;
    };

    CropBox.prototype.updatePreviewCanvas = function() {
        if (this.previewCanvas) {
            this.previewCanvas.width = this.w;
            this.previewCanvas.height = this.h;
            var ctx = this.previewCanvas.getContext('2d');
            ctx.drawImage(this.image, this.x * this.ratioX, this.y * this.ratioY, this.w * this.ratioX, this.h * this.ratioY, 0, 0, this.w, this.h);
        }
    };

    CropBox.prototype.getCropCanvas = function() {
        var croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = this.w;
        croppedCanvas.height = this.h;
        var ctx = croppedCanvas.getContext('2d');
        ctx.drawImage(this.image, this.x * this.ratioX, this.y * this.ratioY, this.w * this.ratioX, this.h * this.ratioY, 0, 0, this.w, this.h);
        return croppedCanvas;
    };

    return {
        ImageEditor: ImageEditor
    };

})();
