import { Observable, from } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { getVersion } from "@ledgerhq/live-common/device/use-cases/getVersionUseCase";
import { FirmwareInfoEntity } from "@ledgerhq/live-common/device/use-cases/getLatestFirmwareForDeviceUseCase";
import { deviceOpt } from "../../scan";

export default {
  args: [deviceOpt],
  job: ({
    device,
  }: Partial<{
    device: string;
  }>): Observable<FirmwareInfoEntity> => withDevice(device || "")(t => from(getVersion(t))),
};
