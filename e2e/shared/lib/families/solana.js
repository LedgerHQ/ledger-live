"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSolana = exports.delegateSolana = void 0;
const expect_1 = __importDefault(require("expect"));
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const Device_1 = require("../enum/Device");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
exports.delegateSolana = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    await (0, speculos_1.getDelegateEvents)(delegatingAccount);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
exports.sendSolana = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    const events = await (0, speculos_1.getSendEvents)(tx);
    const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(tx.amount, events);
    (0, expect_1.default)(isAmountCorrect).toBeTruthy();
    if (process.env.SPECULOS_DEVICE !== Device_1.Device.LNS.name) {
        if (!tx.accountToCredit.address) {
            throw new Error("Recipient address is not set");
        }
        const isAddressCorrect = (0, speculos_1.containsSubstringInEvent)(tx.accountToCredit.address, events);
        (0, expect_1.default)(isAddressCorrect).toBeTruthy();
    }
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
//# sourceMappingURL=solana.js.map