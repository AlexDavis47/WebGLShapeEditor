const tippyOptions = {
    delay: [800, 0], // 300ms delay before showing, 0ms delay before hiding
};

function initializeTooltips() {
    // Layer controls
    tippy('#addLayer', {
        content: 'Add a new layer',
        placement: 'top',
        ...tippyOptions

    });
    tippy('#deleteLayer', {
        content: 'Delete the currently selected layer',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#clearLayer', {
        content: 'Clear all vertices from the current layer',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#copyAllLayers', {
        content: 'Copy data from all layers to clipboard',
        placement: 'top',
        ...tippyOptions
    });

    // Canvas controls
    tippy('#canvasColor', {
        content: 'Change the background color of the canvas',
        placement: 'top',
        ...tippyOptions
    });

    // Snapping controls
    tippy('#gridEnabled', {
        content: 'Enable or disable snapping to grid',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#gridSize', {
        content: 'Set the size of the grid for snapping',
        placement: 'top',
        ...tippyOptions
    });

    // Vertex editor
    tippy('#vertexX', {
        content: 'Set the X coordinate of the selected vertex',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#vertexY', {
        content: 'Set the Y coordinate of the selected vertex',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#vertexR', {
        content: 'Set the Red component of the vertex color (0-1)',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#vertexG', {
        content: 'Set the Green component of the vertex color (0-1)',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#vertexB', {
        content: 'Set the Blue component of the vertex color (0-1)',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#deleteVertex', {
        content: 'Delete the currently selected vertex',
        placement: 'top',
        ...tippyOptions
    });

    // Shape controls
    tippy('#drawMode', {
        content: 'Select the drawing mode for the current layer',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#colorPicker', {
        content: 'Choose a color for new vertices or to change existing vertex colors',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#setColor', {
        content: 'Set the color of the selected vertex',
        placement: 'top',
        ...tippyOptions
    });

    // Export controls
    tippy('#modelName', {
        content: 'Enter a name for your model before exporting',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#exportButton', {
        content: 'Export your shapes as a JavaScript class',
        placement: 'top',
        ...tippyOptions
    });
    tippy('#downloadModel2D', {
        content: 'Download the starter Model2D class that you can use to render your shapes',
        placement: 'top'
    });
}