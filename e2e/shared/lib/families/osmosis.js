"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateOsmosis = void 0;
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const expect_1 = __importDefault(require("expect"));
const DeviceLabels_1 = require("../enum/DeviceLabels");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
exports.delegateOsmosis = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    const events = await (0, speculos_1.getDelegateEvents)(delegatingAccount);
    const amountInUosmo = (Number(delegatingAccount.amount) * 1_000_000).toString();
    const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(amountInUosmo, events);
    (0, expect_1.default)(isAmountCorrect).toBeTruthy();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN);
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
//# sourceMappingURL=osmosis.js.map