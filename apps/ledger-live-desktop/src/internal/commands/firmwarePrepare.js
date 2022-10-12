// @flow

import type { Observable } from "rxjs";
import prepare from "@ledgerhq/live-common/hw/firmwareUpdate-prepare";
import type { FirmwareUpdateContext } from "@ledgerhq/types-live";

type Input = {
  deviceId: string,
  firmware: FirmwareUpdateContext,
};

type Result = { progress: number, displayedOnDevice: boolean };

const cmd = ({ deviceId, firmware }: Input): Observable<Result> => prepare(deviceId, firmware);

cmd.inferSentryTransaction = ({ firmware }) => ({
  data: { finalVersion: firmware?.final?.version },
});

export default cmd;
