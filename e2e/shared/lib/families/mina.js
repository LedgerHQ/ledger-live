"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateMina = void 0;
const expect_1 = __importDefault(require("expect"));
const speculos_1 = require("../speculos");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const speculosAppVersion_1 = require("../speculosAppVersion");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
exports.delegateMina = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    const events = await (0, speculos_1.getDelegateEvents)(delegatingAccount);
    const isProviderCorrect = (0, speculos_1.containsSubstringInEvent)(delegatingAccount.provider, events);
    (0, expect_1.default)(isProviderCorrect).toBeTruthy();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
//# sourceMappingURL=mina.js.map