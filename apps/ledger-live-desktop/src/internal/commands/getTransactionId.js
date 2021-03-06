// @flow

import type { Observable } from "rxjs";
import { from } from "rxjs";
import getTransactionId from "@ledgerhq/live-common/exchange/sell/getTransactionId";
import type { SellRequestEvent } from "@ledgerhq/live-common/exchange/sell/types";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";

type Input = {
  deviceId: string,
};

const cmd = ({ deviceId }: Input): Observable<SellRequestEvent> => {
  return withDevice(deviceId)(transport => from(getTransactionId(transport)));
};

export default cmd;
