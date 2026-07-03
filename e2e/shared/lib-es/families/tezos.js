import expect from "expect";
import { containsSubstringInEvent, getDelegateEvents, getDeviceLabels, pressUntilTextFound, } from "../speculos";
import { isTouchDevice, getSpeculosModel } from "../speculosAppVersion";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";
export const delegateTezos = withDeviceController(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    const { delegateConfirmLabel } = getDeviceLabels(delegatingAccount.account.currency.speculosApp);
    const events = await getDelegateEvents(delegatingAccount);
    // Stake/unstake reviews show the amount on-device; a pure delegation (amount "N/A") shows the
    // baker address + fee but no amount, so only assert when an amount is expected.
    if (delegatingAccount.amount !== "N/A") {
        const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
        expect(isAmountCorrect).toBeTruthy();
    }
    await pressUntilTextFound(delegateConfirmLabel);
    if (isTouchDevice()) {
        await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
    if (getSpeculosModel() === DeviceModelId.nanoS) {
        await pressUntilTextFound(DeviceLabels.ACCEPT_AND_SEND);
        await buttons.both();
    }
});
//# sourceMappingURL=tezos.js.map