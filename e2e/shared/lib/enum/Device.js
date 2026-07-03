"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Device = void 0;
class Device {
    name;
    targetId;
    constructor(name, targetId) {
        this.name = name;
        this.targetId = targetId;
    }
    static LNS = new Device("nanoS", 823132164);
    static LNX = new Device("nanoX", 855638020);
    static LNSP = new Device("nanoSP", 856686596);
    static STAX = new Device("stax", 857735172);
    static FLEX = new Device("flex", 858783748);
    static NANO_GEN_5 = new Device("nanoGen5", 859832324);
}
exports.Device = Device;
//# sourceMappingURL=Device.js.map