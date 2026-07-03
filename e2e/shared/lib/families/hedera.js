"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendHedera = void 0;
const DeviceLabels_1 = require("../enum/DeviceLabels");
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
exports.sendHedera = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    const buttons = getButtonsController();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN);
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.CONFIRM);
        await buttons.both();
    }
});
//# sourceMappingURL=hedera.js.map