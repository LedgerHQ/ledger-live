"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateMultiversX = void 0;
const speculos_1 = require("../speculos");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const speculosAppVersion_1 = require("../speculosAppVersion");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
exports.delegateMultiversX = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    await (0, speculos_1.getDelegateEvents)(delegatingAccount);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN);
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
//# sourceMappingURL=multiversX.js.map