"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSui = void 0;
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
exports.sendSui = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    await (0, speculos_1.getSendEvents)(tx);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
//# sourceMappingURL=sui.js.map