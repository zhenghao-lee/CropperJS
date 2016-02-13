var imageEditor = new ImageEditorJS.ImageEditor();
imageEditor.crop({
    wrapper: document.querySelector('.wrapper'),
    src: '../images/sample.jpg',
    boxSize: [0, 0, "100%", "100%"],
    ratio: 4 / 3,
    previewCanvas: document.querySelector("[hasDataHandler='previewCanvas']")
});
var getResultPositionBtn = document.querySelector("[hasDataHandler='getResultPositionBtn']");
var outputSpan = document.querySelector("[hasDataHandler='outputSpan']");
getResultPositionBtn.addEventListener('click', function() {
    console.log(imageEditor.getCropResult());
    outputSpan.innerHTML = JSON.stringify(imageEditor.getCropResult());
});
var getResultCanvasBtn = document.querySelector("[hasDataHandler='getResultCanvasBtn']");
var previewCanvasHolder = document.querySelector("[hasDataHandler='previewCanvasHolder']");
getResultCanvasBtn.addEventListener('click', function() {
    while (previewCanvasHolder.hasChildNodes()) {
        previewCanvasHolder.removeChild(previewCanvasHolder.lastChild);
    }

    previewCanvasHolder.appendChild(imageEditor.getCropCanvas());
});
