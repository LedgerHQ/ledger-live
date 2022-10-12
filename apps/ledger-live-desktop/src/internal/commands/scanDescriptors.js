// @flow
import type { Observable } from "rxjs";
import { from } from "rxjs";
import { scanDescriptors } from "@ledgerhq/live-common/families/bitcoin/descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AccountDescriptor } from "@ledgerhq/live-common/families/bitcoin/descriptor";

type Input = {
  deviceId: string,
  currencyId: string,
  limit: number,
};

const cmd = ({ deviceId, currencyId, limit = 10 }: Input): Observable<AccountDescriptor> =>
  from(scanDescriptors(deviceId, getCryptoCurrencyById(currencyId), limit));

export default cmd;
