"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateTezos = void 0;
const expect_1 = __importDefault(require("expect"));
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const types_devices_1 = require("@ledgerhq/types-devices");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
exports.delegateTezos = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    const { delegateConfirmLabel } = (0, speculos_1.getDeviceLabels)(delegatingAccount.account.currency.speculosApp);
    const events = await (0, speculos_1.getDelegateEvents)(delegatingAccount);
    // Stake/unstake reviews show the amount on-device; a pure delegation (amount "N/A") shows the
    // baker address + fee but no amount, so only assert when an amount is expected.
    if (delegatingAccount.amount !== "N/A") {
        const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(delegatingAccount.amount, events);
        (0, expect_1.default)(isAmountCorrect).toBeTruthy();
    }
    await (0, speculos_1.pressUntilTextFound)(delegateConfirmLabel);
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN);
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
    if ((0, speculosAppVersion_1.getSpeculosModel)() === types_devices_1.DeviceModelId.nanoS) {
        await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.ACCEPT_AND_SEND);
        await buttons.both();
    }
});
//# sourceMappingURL=tezos.js.map