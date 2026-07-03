"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateKaspa = exports.sendKaspa = void 0;
const expect_1 = __importDefault(require("expect"));
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
exports.sendKaspa = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    await (0, speculos_1.getSendEvents)(tx);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
exports.delegateKaspa = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.REVIEW_OPERATION);
    const events = await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.APPROVE);
    const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(delegatingAccount.amount, events);
    (0, expect_1.default)(isAmountCorrect).toBeTruthy();
    await buttons.both();
});
//# sourceMappingURL=kaspa.js.map