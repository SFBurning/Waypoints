﻿// Rig for Athena Demosfunction BuildUI(thisObj) {    var win = thisObj instanceof Panel ? thisObj : new Window("palette", "AutoRig", undefined, {        resizeable: true    });    win.lightRig = win.add("button", [10, 5, 80, 35], "Rig Setup");    win.lightRig.onClick = rigLight;    win.layerRig = win.add("button", [85, 5, 150, 35], "Rig Layer");    win.layerRig.onClick = rigSetup;    win.targetAdd = win.add("button", [10, 40, 150, 70], "Add Target");    win.targetAdd.onClick = addTarget;}// Insantiate the user interfaceBuildUI(this);// Globalsvar globalLightTargetsLayer;var globalCamCtrlLayer;function rigLayer() {    //var inertialBounce = "n = 0; if (numKeys > 0){n = nearestKey(time).index;if (key(n).time > time){ n--; } } if (n == 0){ t = 0; }else{ t = time - key(n).time; } if (n > 0){ v = velocityAtTime(key(n).time - thisComp.frameDuration/10); amp = .05; freq = 4.0; decay = 2.0; value + v*amp*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t); }else{ value; }"    app.beginUndoGroup("Rig Layer");    var curComp = app.project.activeItem;    var selLayers = curComp.selectedLayers;    var lightTargetsLayer;    var camCtrl;    // Find the light control layer     for (var i = 1; i <= curComp.numLayers; i++) {        if (curComp.layer(i).name == "Light Targets") {            lightTargetsLayer = curComp.layer(i);            break;        }    }    // Find the cam control layer    for (var i = 1; i <= curComp.numLayers; i++) {        if (curComp.layer(i).name == "Camera CTRL") {            camCtrl = curComp.layer(i);            break;        }    }    if (camCtrl == null || lightTargetsLayer = null) {        alert("Could not find control layers! \n\n Exiting.");        return 1;    }    app.endUndoGroup();}function rigSetup() {    app.beginUndoGroup("Rig Lights");    var curComp = app.project.activeItem;    // Create the ambient Light    var ambLight = curComp.layers.addLight("Ambient Light", [0, 0]);    ambLight.position.setValue([curComp.width / 2, curComp.height / 2, 500]);    ambLight.lightType = LightType.AMBIENT;    // Create the point light    var pntLight = curComp.layers.addLight("Point Light", [0, 0]);    pntLight.position.setValue([curComp.width / 2, curComp.height / 2, -500]);    pntLight.lightType = LightType.POINT;    // The Point light must cast shadows    pntLight.lightOption.castsShadows.setValue(1);    // Up the shadow diffusion    pntLight.lightOption.shadowDiffusion.setValue(100.0);    // Set up the dimmer     // Check for Dimmer Layer    // Create the camera    var theCamera = curComp.layers.addCamera("Main Cam", [curComp.width / 2, curComp.height / 2]);    theCamera.position.setValue([curComp.width / 2, curComp.height / 2, theCamera.position.value[2]]);    // Create the camera parent    var camParent = curComp.layers.addNull();    camParent.name = "Camera Parent Null";    camParent.threeDLayer = true;    camParent.position.setValue([curComp.width / 2, curComp.height / 2, 0]);    // Create the camera controls    var camCtrl = camParent.duplicate();    camCtrl.name = "Camera CTRL";    // GLOBAL    globalCamCtrlLayer = camCtrl;    // Expressions!    camParent.position.expression = "x = thisComp.layer(\"Camera CTRL\").transform.position[0]; y = thisComp.layer(\"Camera CTRL\").transform.position[1]; z = 0; [x,y,z];";    camParent.transform.orientation.expression = "thisComp.layer(\"Camera CTRL\").transform.orientation";    camParent.transform.xRotation.expression = "thisComp.layer(\"Camera CTRL\").transform.xRotation";    camParent.transform.yRotation.expression = "thisComp.layer(\"Camera CTRL\").transform.yRotation";    camParent.transform.zRotation.expression = "thisComp.layer(\"Camera CTRL\").transform.zRotation";    // DEPRECATED: Create the dolly controlz    //z    // var dolly = camParent("Effects").addProperty("ADBE Slider Control");    // dolly.name = "Dolly";    theCamera.parent = camParent;    theCamera.position.expression = "ctrl = thisComp.layer(\"Camera CTRL\").transform.position[2]; [thisProperty[0], thisProperty[1], thisProperty[2] + ctrl];";    theCamera.locked = true;    camParent.locked = true;    // DIMMER    // Make the dimmer     // Create an effect to control dimming    var dimmerSlider = camCtrl.property("Effects").addProperty("ADBE Slider Control");    dimmerSlider.name = ("Light Dimmer")    // Reassign the variable to grab tha actual slider    dimmerSlider = dimmerSlider.property("Slider");    // Clamp the range    dimmerSlider.expression = "clamp(thisProperty, 0,100);"    // Create an effect to control the master extrusion level    var masterExtrusion = camCtrl.property("Effects").addProperty("ADBE Slider Control");    masterExtrusion.name = "Master Extrusion Depth";    masterExtrusion.property("Slider").setValue(200);    // Create an effect to control the current position of the light    var lightPositionCtrl = camCtrl.property("Effects").addProperty("ADBE Slider Control");    lightPositionCtrl.property("Slider").setValue(1.0);    lightPositionCtrl.name = "Light Position";    lightPositionCtrl.property("Slider").expression = "Math.round(thisProperty)";    // Now that the dimmer is set up, create the expressions on the lights.    pntLight.lightOption.intensity.expression = "linear(thisComp.layer(\"Camera CTRL\").effect(\"Light Dimmer\")(\"Slider\"), 0, 100, 0, 150)";    ambLight.lightOption.intensity.expression = "linear(thisComp.layer(\"Camera CTRL\").effect(\"Light Dimmer\")(\"Slider\"), 0, 100, 100, 0)";    // Create a "Light Targets" layer to hold the sequencing of the lights.     var lightTargetsLayer = curComp.layers.addNull();    lightTargetsLayer.name = "Light Targets";    var firstTarget = lightTargetsLayer.property("Effects").addProperty("ADBE Layer Control");    firstTarget.name = "Target 1";    // GLOBAL    globalLightTargetsLayer = lightTargetsLayer;    // ...And now the Waypoint expression on the position of the the point light. Defined below because that     var waypointExp = "l = thisComp.layer(\"Light Targets\");\n l2 = thisComp.layer(\"Camera CTRL\");\n curLightCtrl = l2.effect(\"Light Position\")(\"Slider\");\n z = thisProperty[2];\n \n var d = false;\n var numTargets = 0;\n while (d == false) {\n     try {\n         numTargets++;\n         t = l.effect(numTargets);\n     } catch (err) {\n         numTargets = numTargets - 1;\n         d = true;\n     }\n }\n var waypoints = new Array();\n var curLayer = null;\n for (var i = 1; i < numTargets + 1; i++) {\n     curLayer = l.effect(i)(\"Layer\");\n     waypoints.push([curLayer.position[0], curLayer.position[1]]);\n }\n if (curLightCtrl.numKeys > 1) {\n     nk = curLightCtrl.nearestKey(time);\n     if (nk.time >= time) {\n         if (nk.index == 1) {\n             prevKey = nk;\n             nextKey = nk;\n         } else {\n             prevKey = curLightCtrl.key((nk.index) - 1);\n             nextKey = nk;\n         }\n     } else {\n         prevKey = nk;\n         try {\n             nextKey = curLightCtrl.key(nk.index + 1);\n         } catch (err) {\n             nextKey = nk;\n         }\n     }\n     /* \n     The following try/catch statemnts attempt to set the lower and upper limits of the linear conversion\n     In the event of an error, the min values default to waypoints[0][x], and the upper limits default to \n     waypoints[waypoints.length-1][x]. Look at us, all clever and shit. \n     */\n     var xmin, xmax, ymin, ymax = null;\n     var minIndex, maxIndex = null;\n \n     var prevKeyValue = Math.round(prevKey.value);\n     var nextKeyValue = Math.round(nextKey.value);\n \n     minIndex = clamp(prevKeyValue, 0, numTargets - 1);\n     maxIndex = clamp(nextKeyValue, 0, numTargets - 1);\n \n     x = linear(time, prevKey.time, nextKey.time, waypoints[minIndex][0], waypoints[maxIndex][0]);\n     y = linear(time, prevKey.time, nextKey.time, waypoints[minIndex][1], waypoints[maxIndex][1]);\n     [x, y, z];\n } else {\n     try {\n         x = waypoints[0, 0];\n         y = waypoints[0, 1];\n         [x, y, z]\n     } catch (err) {\n         x = thisComp.width / 2;\n         y = thisComp.height / 2;\n         [x, y, z];\n     }\n     thisProperty;\n }";    pntLight.position.expression = waypointExp;    app.endUndoGroup();};function addTarget() {    app.beginUndoGroup("Add Targets");    // Boilerplater     var curComp = app.project.activeItem;    var selLayers = curComp.selectedLayers;    var selLayersBackup = curComp.selectedLayers;    var lightTargetsLayer;    // Find the light control layer     for (var i = 1; i <= curComp.numLayers; i++) {        if (curComp.layer(i).name == "Light Targets") {            lightTargetsLayer = curComp.layer(i);            break;        }    }    // Exit if target cannot be found    if (lightTargetsLayer == null) {        alert("Could not find control layers! \n\n Exiting.");        return 1;    }    // Determine the number to start at    var numTargets = lightTargetsLayer.property("Effects").numProperties;    // Loop through each selected layer in order and add them to the the target layers panel    for (var i = 0; i < selLayers.length; i++) {        var targetName = "Target " + (numTargets + i + 1);        var curLayerEffect = selLayers[i].property("Effects").addProperty("ADBE Layer Control");        curLayerEffect.name = targetName;        // Some UI Scripting to copy the layer effect to the target layers panel        // Close an reopen the timeline to give it focus        app.executeCommand(-524336);        $.sleep(200);        app.executeCommand(-524336);        $.sleep(100);        app.executeCommand(app.findMenuCommandId("Deselect All"));        $.sleep(100);        // Close and reopen the layers panel to give it focus        app.executeCommand(-524330);        $.sleep(200);        app.executeCommand(-524330);        $.sleep(100);        app.executeCommand(app.findMenuCommandId("Select All"));        $.sleep(100);        app.executeCommand(app.findMenuCommandId("Cut"));        $.sleep(100);        app.executeCommand(app.findMenuCommandId("Deselect All"));        $.sleep(100);        // Close an reopen the timeline to give it focus        app.executeCommand(-524336);        $.sleep(200);        app.executeCommand(-524336);        $.sleep(100);        lightTargetsLayer.selected = true;        $.sleep(100);        app.executeCommand(app.findMenuCommandId("Paste"));        $.sleep(100);    }    app.endUndoGroup();}