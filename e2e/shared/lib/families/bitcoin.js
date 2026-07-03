"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBTC = exports.sendBTCBasedCoin = void 0;
const expect_1 = __importDefault(require("expect"));
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const invariant_1 = __importDefault(require("invariant"));
const types_devices_1 = require("@ledgerhq/types-devices");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
const Currency_1 = require("../enum/Currency");
const getSignTransactionLabel = (currencyId) => {
    switch (currencyId) {
        case Currency_1.Currency.ZEC.id:
            return DeviceLabels_1.DeviceLabels.SIGN_TRANSACTION;
        default:
            return DeviceLabels_1.DeviceLabels.ACCEPT;
    }
};
exports.sendBTCBasedCoin = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx, currencyId) => {
    if (!tx.accountToCredit.address) {
        throw new Error("Recipient address is not set");
    }
    const buttons = getButtonsController();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        const events = await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN);
        const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(tx.amount, events);
        (0, expect_1.default)(isAmountCorrect).toBeTruthy();
        const isAddressCorrect = (0, speculos_1.containsSubstringInEvent)(tx.accountToCredit.address, events);
        (0, expect_1.default)(isAddressCorrect).toBeTruthy();
        await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        const amountStep = await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.AMOUNT);
        const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(tx.amount, amountStep);
        (0, expect_1.default)(isAmountCorrect).toBeTruthy();
        const addressStep = await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.ADDRESS);
        const isAddressCorrect = (0, speculos_1.containsSubstringInEvent)(tx.accountToCredit.address, addressStep);
        (0, expect_1.default)(isAddressCorrect).toBeTruthy();
        await (0, speculos_1.pressUntilTextFound)(getSignTransactionLabel(currencyId));
        if (currencyId !== Currency_1.Currency.ZEC.id) {
            await buttons.both();
            await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.CONFIRM);
            await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.ACCEPT);
        }
        await buttons.both();
    }
});
exports.sendBTC = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    const speculosDevice = (0, speculosAppVersion_1.getSpeculosModel)();
    try {
        const events = await (0, speculos_1.getSendEvents)(tx);
        const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(tx.amount, events);
        (0, expect_1.default)(isAmountCorrect).toBeTruthy();
        if (!tx.accountToCredit.address) {
            throw new Error("Recipient address is not set");
        }
        const isAddressCorrect = (0, speculos_1.containsSubstringInEvent)(tx.accountToCredit.address, events);
        (0, expect_1.default)(isAddressCorrect).toBeTruthy();
        if ((0, speculosAppVersion_1.isTouchDevice)()) {
            await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
        }
        else {
            await buttons.both();
            if (speculosDevice === types_devices_1.DeviceModelId.nanoS) {
                await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SIGN);
                await buttons.both();
                await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.BITCOIN_IS_READY);
            }
            else {
                await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.TRANSACTION_SIGNED);
            }
        }
    }
    catch (e) {
        (0, invariant_1.default)(false, `Error while sending BTC transaction: ${e}`);
    }
});
//# sourceMappingURL=bitcoin.js.map