import { getDelegateEvents, pressUntilTextFound } from "../speculos";
import { DeviceLabels } from "../enum/DeviceLabels";
import { isTouchDevice } from "../speculosAppVersion";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";
export const delegateMultiversX = withDeviceController(({ getButtonsController }) => async (delegatingAccount) => {
    const buttons = getButtonsController();
    await getDelegateEvents(delegatingAccount);
    if (isTouchDevice()) {
        await pressUntilTextFound(DeviceLabels.HOLD_TO_SIGN);
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
//# sourceMappingURL=multiversX.js.map