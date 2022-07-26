// @flow
import type { Observable } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import type { App } from "@ledgerhq/live-common/types/manager";
import { execWithTransport } from "@ledgerhq/live-common/apps/hw";
import type { AppOp } from "@ledgerhq/live-common/apps/index";

type Input = {
  deviceId: string,
  appOp: AppOp,
  targetId: string | number,
  app: App,
};

type Result = {
  progress: number,
};

const cmd = ({ deviceId, appOp, targetId, app }: Input): Observable<Result> =>
  withDevice(deviceId)(transport => execWithTransport(transport)(appOp, targetId, app));

cmd.inferSentryTransaction = ({ appOp }) => ({
  tags: {
    ...appOp,
    op: appOp.type + " " + appOp.name,
  },
});

export default cmd;
