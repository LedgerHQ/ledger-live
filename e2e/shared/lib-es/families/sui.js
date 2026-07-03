import { getSendEvents } from "../speculos";
import { isTouchDevice } from "../speculosAppVersion";
import { DeviceLabels } from "../enum/DeviceLabels";
import { longPressAndRelease } from "../deviceInteraction/TouchDeviceSimulator";
import { withDeviceController } from "../deviceInteraction/DeviceController";
export const sendSui = withDeviceController(({ getButtonsController }) => async (tx) => {
    const buttons = getButtonsController();
    await getSendEvents(tx);
    if (isTouchDevice()) {
        await longPressAndRelease(DeviceLabels.HOLD_TO_SIGN, 3);
    }
    else {
        await buttons.both();
    }
});
//# sourceMappingURL=sui.js.map