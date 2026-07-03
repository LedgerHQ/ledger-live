import expect from "expect";
import { waitFor, containsSubstringInEvent, pressUntilTextFound, getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";
export const sendKaspa = withDeviceController(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    await getSendEvents(tx);
    if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
export const delegateKaspa = withDeviceController(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    await waitFor(DeviceLabels.REVIEW_OPERATION);
    const events = await pressUntilTextFound(DeviceLabels.APPROVE);
    const isAmountCorrect = containsSubstringInEvent(delegatingAccount.amount, events);
    expect(isAmountCorrect).toBeTruthy();
    await buttons.both();
});
//# sourceMappingURL=kaspa.js.map