"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signTypedMessageButtonDevice = exports.approveTokenButtonDevice = exports.sendEvmNanoS = exports.sendEvmButtonDevice = void 0;
exports.sendEVM = sendEVM;
exports.approveTokenTouchDevices = approveTokenTouchDevices;
exports.approveToken = approveToken;
exports.signTypedMessageTouchDevices = signTypedMessageTouchDevices;
exports.signTypedMessage = signTypedMessage;
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const Device_1 = require("../enum/Device");
const Currency_1 = require("../enum/Currency");
const types_devices_1 = require("@ledgerhq/types-devices");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
const live_env_1 = require("@ledgerhq/live-env");
const deviceCoordinates_1 = require("../deviceCoordinates");
function formatEventsForError(events, maxLength = 1000) {
    const formatted = events.map((e, i) => `  [${i}] ${e}`).join("\n");
    if (formatted.length <= maxLength) {
        return formatted;
    }
    return `${formatted.slice(0, maxLength)}...\n  (truncated, ${events.length} total events)`;
}
// TODO: remove once LIVE-28070 is fixed
function shouldSkipRecipientDisplayValidation(tx) {
    return (tx.accountToCredit.currency.id === Currency_1.Currency.POL.id ||
        tx.accountToCredit.currency.id === Currency_1.Currency.BASE.id);
}
function validateTransactionData(tx, events) {
    const formattedEvents = formatEventsForError(events);
    const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(tx.amount, events);
    if (!isAmountCorrect) {
        throw new Error(`Expected amount "${tx.amount}" to be displayed on Speculos device, but it was not found.\nEvents:\n${formattedEvents}`);
    }
    if (shouldSkipRecipientDisplayValidation(tx)) {
        return;
    }
    if (tx.accountToCredit.ensName && process.env.SPECULOS_DEVICE !== Device_1.Device.LNS.name) {
        const isENSNameCorrect = (0, speculos_1.containsSubstringInEvent)(tx.accountToCredit.ensName, events);
        if (!isENSNameCorrect) {
            throw new Error(`Expected ENS name "${tx.accountToCredit.ensName}" to be displayed on Speculos device, but it was not found.\nEvents:\n${formattedEvents}`);
        }
    }
    else {
        if (!tx.accountToCredit.address) {
            throw new Error("Recipient address is not set");
        }
        const isAddressCorrect = (0, speculos_1.containsSubstringInEvent)(tx.accountToCredit.address, events);
        if (!isAddressCorrect) {
            throw new Error(`Expected recipient address "${tx.accountToCredit.address}" to be displayed on Speculos device, but it was not found.\nEvents:\n${formattedEvents}`);
        }
    }
}
async function sendEvmTouchDevices(tx) {
    await (0, speculos_1.waitForReviewTransaction)();
    const events = [];
    if (tx.accountToCredit.ensName) {
        const ensEvents = await getEnsScreenTexts(tx.accountToCredit.ensName);
        events.push(...ensEvents);
    }
    events.push(...(await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN)));
    validateTransactionData(tx, events);
    await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
}
exports.sendEvmButtonDevice = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    const events = await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SIGN_TRANSACTION);
    validateTransactionData(tx, events);
    await buttons.both();
});
exports.sendEvmNanoS = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    const events = await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.ACCEPT);
    validateTransactionData(tx, events);
    await buttons.both();
});
async function sendEVM(tx) {
    const speculosModel = (0, speculosAppVersion_1.getSpeculosModel)();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        return sendEvmTouchDevices(tx);
    }
    if (speculosModel === types_devices_1.DeviceModelId.nanoS) {
        return (0, exports.sendEvmNanoS)(tx);
    }
    return (0, exports.sendEvmButtonDevice)(tx);
}
async function getEnsScreenTexts(ensName) {
    const events = [];
    await (0, TouchDeviceSimulator_1.swipeRight)();
    await (0, speculos_1.waitFor)(ensName);
    events.push(...(await (0, speculos_1.pressUntilTextFound)(ensName)));
    const { x: ensX, y: ensY } = (0, deviceCoordinates_1.getDeviceCoordinates)("ensArrowOpen");
    await (0, TouchDeviceSimulator_1.pressAndRelease)(">", ensX, ensY);
    const ensScreenTexts = await (0, speculos_1.fetchCurrentScreenTexts)((0, live_env_1.getEnv)("SPECULOS_API_PORT"));
    events.push(...ensScreenTexts);
    const { x: backX, y: backY } = (0, deviceCoordinates_1.getDeviceCoordinates)("arrowBack");
    await (0, TouchDeviceSimulator_1.pressAndRelease)("<", backX, backY);
    return events;
}
async function approveTokenTouchDevices() {
    await (0, speculos_1.waitForReviewTransaction)();
    await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN);
    await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
}
exports.approveTokenButtonDevice = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.REVIEW_TRANSACTION_TO);
    await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SIGN_TRANSACTION);
    await getButtonsController().both();
});
async function approveToken() {
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        return approveTokenTouchDevices();
    }
    return (0, exports.approveTokenButtonDevice)();
}
async function signTypedMessageTouchDevices() {
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.REVIEW_TYPED_MESSAGE);
    await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN);
    await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
}
exports.signTypedMessageButtonDevice = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async () => {
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.REVIEW_TYPED_MESSAGE);
    await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SIGN_TYPED_MESSAGE);
    await getButtonsController().both();
});
async function signTypedMessage() {
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        return signTypedMessageTouchDevices();
    }
    return (0, exports.signTypedMessageButtonDevice)();
}
//# sourceMappingURL=evm.js.map