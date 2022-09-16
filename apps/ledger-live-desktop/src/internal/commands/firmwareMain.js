// @flow

import type { Observable } from "rxjs";
import main from "@ledgerhq/live-common/hw/firmwareUpdate-main";
import type { FirmwareUpdateContext } from "@ledgerhq/types-live";

type Input = FirmwareUpdateContext;

type Result = { progress: number, installing: ?string };

// deviceId='' HACK to not depend on a deviceId because it's dynamic
const cmd = (firmware: Input): Observable<Result> => main("", firmware);

cmd.inferSentryTransaction = firm => ({ data: { finalVersion: firm?.final?.version } });

export default cmd;
