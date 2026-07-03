"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delegateNanoAction = exports.sendCardanoButtonDevice = exports.sendCardanoNanoS = void 0;
exports.sendCardano = sendCardano;
exports.delegateCardano = delegateCardano;
const expect_1 = __importDefault(require("expect"));
const speculos_1 = require("../speculos");
const speculosAppVersion_1 = require("../speculosAppVersion");
const TouchDeviceSimulator_1 = require("../deviceInteraction/TouchDeviceSimulator");
const DeviceLabels_1 = require("../enum/DeviceLabels");
const types_devices_1 = require("@ledgerhq/types-devices");
const DeviceController_1 = require("../deviceInteraction/DeviceController");
function validateTransactionData(tx, events) {
    if (!tx.accountToCredit.address) {
        throw new Error("Recipient address is not set");
    }
    const isAddressCorrect = (0, speculos_1.containsSubstringInEvent)(tx.accountToCredit.address, events);
    (0, expect_1.default)(isAddressCorrect).toBeTruthy();
    const isAmountCorrect = (0, speculos_1.containsSubstringInEvent)(tx.amount, events);
    (0, expect_1.default)(isAmountCorrect).toBeTruthy();
}
async function sendCardanoTouchDevices(tx) {
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.REVIEW_TRANSACTION);
    const events = await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.AMOUNT);
    validateTransactionData(tx, events);
    await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.TAP_TO_CONTINUE);
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.FEES);
    await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.TAP_TO_CONTINUE);
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.SIGN_TRANSACTION);
    await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
}
exports.sendCardanoNanoS = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (_tx) => {
    const buttons = getButtonsController();
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.NEW_ORDINARY);
    await buttons.right();
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.SEND_TO_ADDRESS);
    await buttons.both();
    await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SEND);
    await buttons.both();
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.TRANSACTION_FEE);
    await buttons.both();
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.CONFIRM);
    await buttons.right();
});
exports.sendCardanoButtonDevice = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.NEW_ORDINARY);
    await buttons.both();
    await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SEND_TO_ADDRESS_2);
    await buttons.both();
    const events = await (0, speculos_1.pressUntilTextFound)(DeviceLabels_1.DeviceLabels.SEND);
    validateTransactionData(tx, events);
    await buttons.both();
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.TRANSACTION_FEE);
    await buttons.both();
    await (0, speculos_1.waitFor)(DeviceLabels_1.DeviceLabels.CONFIRM);
    await buttons.both();
});
async function sendCardano(tx) {
    const speculosModel = (0, speculosAppVersion_1.getSpeculosModel)();
    if ((0, speculosAppVersion_1.isTouchDevice)()) {
        return sendCardanoTouchDevices(tx);
    }
    if (speculosModel === types_devices_1.DeviceModelId.nanoS) {
        return (0, exports.sendCardanoNanoS)(tx);
    }
    return (0, exports.sendCardanoButtonDevice)(tx);
}
const TOUCH_DELEGATE_STEPS = [
    [DeviceLabels_1.DeviceLabels.REVIEW_TRANSACTION, "swipe"],
    [DeviceLabels_1.DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels_1.DeviceLabels.REGISTER, "swipe"],
    [DeviceLabels_1.DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels_1.DeviceLabels.CONFIRM, "confirm"],
    [DeviceLabels_1.DeviceLabels.DELEGATE_STAKE, "swipe"],
    [DeviceLabels_1.DeviceLabels.TAP_TO_CONTINUE, "tap"],
    [DeviceLabels_1.DeviceLabels.CONFIRM, "confirm"],
    [DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, "hold"],
];
const DELEGATE_STEPS_CONFIG = {
    [types_devices_1.DeviceModelId.stax]: TOUCH_DELEGATE_STEPS,
    [types_devices_1.DeviceModelId.europa]: TOUCH_DELEGATE_STEPS,
    [types_devices_1.DeviceModelId.apex]: TOUCH_DELEGATE_STEPS,
    [types_devices_1.DeviceModelId.nanoS]: [
        [DeviceLabels_1.DeviceLabels.NEW_ORDINARY, "right"],
        [DeviceLabels_1.DeviceLabels.TRANSACTION_FEE, "both"],
        [DeviceLabels_1.DeviceLabels.REGISTER, "both"],
        [DeviceLabels_1.DeviceLabels.STAKE_KEY, "both"],
        [DeviceLabels_1.DeviceLabels.DEPOSIT, "both"],
        [DeviceLabels_1.DeviceLabels.CONFIRM, "right"],
        [DeviceLabels_1.DeviceLabels.DELEGATE_STAKE, "both"],
        [DeviceLabels_1.DeviceLabels.STAKE_KEY, "both"],
        [DeviceLabels_1.DeviceLabels.CONFIRM, "right"],
        [DeviceLabels_1.DeviceLabels.CONFIRM, "right"],
    ],
    default: [
        [DeviceLabels_1.DeviceLabels.NEW_ORDINARY, "both"],
        [DeviceLabels_1.DeviceLabels.TRANSACTION_FEE, "both"],
        [DeviceLabels_1.DeviceLabels.REGISTER, "both"],
        [DeviceLabels_1.DeviceLabels.STAKE_KEY, "both"],
        [DeviceLabels_1.DeviceLabels.DEPOSIT, "both"],
        [DeviceLabels_1.DeviceLabels.CONFIRM, "both"],
        [DeviceLabels_1.DeviceLabels.DELEGATE_STAKE, "both"],
        [DeviceLabels_1.DeviceLabels.STAKE_KEY, "both"],
        [DeviceLabels_1.DeviceLabels.CONFIRM, "both"],
        [DeviceLabels_1.DeviceLabels.CONFIRM, "both"],
    ],
};
function getConfirmButtonCoords() {
    const speculosModel = (0, speculosAppVersion_1.getSpeculosModel)();
    switch (speculosModel) {
        case types_devices_1.DeviceModelId.stax:
            return { x: 152, y: 532 };
        case types_devices_1.DeviceModelId.apex:
            return { x: 114, y: 305 };
        case types_devices_1.DeviceModelId.europa:
        default:
            return { x: 186, y: 446 };
    }
}
async function delegateTouchDevicesAction(label) {
    const CONFIRM_BUTTON_COORDS = getConfirmButtonCoords();
    await (0, speculos_1.waitFor)(label);
    switch (label) {
        case DeviceLabels_1.DeviceLabels.TAP_TO_CONTINUE:
            await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.TAP_TO_CONTINUE);
            break;
        case DeviceLabels_1.DeviceLabels.CONFIRM:
            await (0, TouchDeviceSimulator_1.pressAndRelease)(DeviceLabels_1.DeviceLabels.CONFIRM, CONFIRM_BUTTON_COORDS.x, CONFIRM_BUTTON_COORDS.y);
            break;
        case DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN:
            await (0, TouchDeviceSimulator_1.longPressAndRelease)(DeviceLabels_1.DeviceLabels.HOLD_TO_SIGN, 3);
            break;
        default:
            await (0, TouchDeviceSimulator_1.swipeRight)();
            break;
    }
}
exports.delegateNanoAction = (0, DeviceController_1.withDeviceController)(({ getButtonsController }) => async (label, action) => {
    const buttons = getButtonsController();
    await (0, speculos_1.waitFor)(label);
    if (action === "both") {
        await buttons.both();
    }
    else {
        await buttons.right();
    }
});
async function executeDelegateStep(label, action) {
    try {
        if ((0, speculosAppVersion_1.isTouchDevice)()) {
            await delegateTouchDevicesAction(label);
        }
        else {
            await (0, exports.delegateNanoAction)(label, action);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Error while waiting for "${label}":`, message);
        throw error;
    }
}
async function delegateCardano() {
    const speculosModel = (0, speculosAppVersion_1.getSpeculosModel)();
    const steps = (0, speculosAppVersion_1.isTouchDevice)() && DELEGATE_STEPS_CONFIG[speculosModel]
        ? DELEGATE_STEPS_CONFIG[speculosModel]
        : speculosModel === types_devices_1.DeviceModelId.nanoS
            ? DELEGATE_STEPS_CONFIG[types_devices_1.DeviceModelId.nanoS]
            : DELEGATE_STEPS_CONFIG.default;
    for (const [label, action] of steps) {
        await executeDelegateStep(label, action);
    }
}
//# sourceMappingURL=cardano.js.map