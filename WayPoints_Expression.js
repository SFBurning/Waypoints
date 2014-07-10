// Pull the list of targets. 
// This should be the only line that needs to be cobbled together in the script
l = thisComp.layer("Light Targets");
l2 = thisComp.layer("Camera CTRL");
// On that layer, grab the light position slider
curLightCtrl = l2.effect("Light Position")("Slider");
// We don't want to effect the z-value of the light. We'll simply grab it here for consistency later on.
z = thisProperty[2];

// Switch for later on, when we need to solve for the number of targets
var d = false;
// This assumes two control layers and at least one target layer.
// AE Indexing starts from 1, so 3 really is the third layer
// Here we start at 2 because the first "try" will take us up to the appropriate point
var numTargets = 0;
// Determine the number of layers to navigate
while (d == false) {
    // Try to grab the effect of index ("NumTargets"). 
    try {
        numTargets++;
        t = l.effect(numTargets);
    } catch (err) {
        // The actual value is one less; we already added 1 to the tally before erroring out
        // The try will not error until it reaches the 2nd line, by which point numTargets has already changed  
        numTargets = numTargets - 1;
        d = true;
    }
}
// We'll need to fill this array with the x and y positions of the layers on each frame.
var waypoints = new Array();
// push the comp width and height to the first location in the array.
// A workaround because AE keys are 1-indexed, not 0-indexed
waypoints.push([thisComp.width / 2, thisComp.height / 2]);

// Start with no layers, but establish this as a global variable
var curLayer = null;
// Loop through each of the layer targets available in the effects panel
for (var i = 1; i < numTargets + 1; i++) {
    // Grab the layer reference by the effects panel
    curLayer = l.effect(i)("Layer");
    // Push the x and y values of the current layer into the 2D array "waypoints"
    waypoints.push([curLayer.position[0], curLayer.position[1]]);
}
// Check to see that we have at least 2 keys-- otherwise, interpolation is pointless
if (curLightCtrl.numKeys > 0) {
    // Pull in the nearest keys of the light position control
    nk = curLightCtrl.nearestKey(time);
    // Check if we are coming or going
    if (nk.time >= time) {
        // If we're approaching that key
        // Check to see if it's the first key
        if (nk.index == 1) {
            // if it is, just set both prevkey and next key to the same, first keyframe
            prevKey = nk;
            nextKey = nk;
        } else {
            prevKey = curLightCtrl.key((nk.index) - 1);
            nextKey = nk;
        }
    } else {
        // If we're leaving that key
        prevKey = nk;
        // Try to see if there is a next key. If not, fill in the current key as the final one. 
        try {
            nextKey = curLightCtrl.key(nk.index + 1);
        } catch (err) {
            nextKey = nk;
        }
    }
    /* 
    The following try/catch statemnts attempt to set the lower and upper limits of the linear conversion
    In the event of an error, the min values default to waypoints[0][x], and the upper limits default to 
    waypoints[waypoints.length-1][x]. Look at us, all clever and shit. 
    */
    // Bounds for the linear expression
    var xmin, xmax, ymin, ymax = null;
    // Minimum and maximum indices for the waypoints array
    var minIndex, maxIndex = null;

    var prevKeyValue = Math.round(prevKey.value);
    var nextKeyValue = Math.round(nextKey.value);

    minIndex = clamp(prevKeyValue, 0, numTargets);
    maxIndex = clamp(nextKeyValue, 0, numTargets);
    var userInterpolate = l2.effect("Interpolation")("Checkbox");
    // Check to see if this frame needs to be interpolated 
    if (userInterpolate == 1) {
        // Now interpolate between the x value of the layer at the previous key and the next key over time
        x = linear(time, prevKey.time, nextKey.time, waypoints[minIndex][0], waypoints[maxIndex][0]);
        y = linear(time, prevKey.time, nextKey.time, waypoints[minIndex][1], waypoints[maxIndex][1]);
    }
    // If there is no interpolation, just use the previous key 
    else {
        x = waypoints[minIndex][0];
        y = waypoints[minIndex][1];
    }
    // Return the interpolated array. Woohoo!
    [x, y, z];
} else {
    // If there's nothing to interpolate (no more than one control point), simply return the x and y values for the currently selected layer;
    try {
        x = waypoints[1, 0];
        y = waypoints[1, 1];
        // Return the final position. Party all the time!
        [x, y, z]
    } catch (err) {
        // If there aren't any values in waypoints to pull from, merely return the center point of the composition.
        x = thisComp.width / 2;
        y = thisComp.height / 2;
        [x, y, z];
    }
    thisProperty;
}