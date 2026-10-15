// Content-script entry point. Feature files (from M2 on) register themselves
// in ViBoot.features before this runs.
"use strict";

globalThis.ViBoot.startRouter();
