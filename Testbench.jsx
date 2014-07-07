// Testbench, for the little stuff.

// Boilerplate

var curComp = app.project.activeItem;
var selLayer = app.project.selectedLayers[0];

// GO WILD

alert(app.project.item(1).layer("Light Targets").property("Effects").property("Target 1")("Layer"));