import { Observable, from } from "rxjs";
import {
  GetAccountShape,
  IterateResultBuilder,
  makeAccountBridgeReceive as commonMakeAccountBridgeReceive,
  makeScanAccounts as commonMakeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, CurrencyBridge } from "@ledgerhq/types-live";
import { GetAddressOptions, Result } from "@ledgerhq/coin-framework/derivation";
import Transport from "@ledgerhq/hw-transport";
import { withDevice } from "../hw/deviceAccess";
import getAddress from "../hw/getAddress";

export {
  AccountShapeInfo,
  GetAccountShape,
  IterateResultBuilder,
  makeSync,
  mergeNfts,
  mergeOps,
  sameOp,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";

function getAddr(deviceId: string, opts: GetAddressOptions): Promise<Result> {
  return withDevice(deviceId)((transport: Transport) =>
    from(getAddress(transport, opts)),
  ).toPromise();
}

export const makeScanAccounts = ({
  getAccountShape,
  buildIterateResult,
}: {
  getAccountShape: GetAccountShape;
  buildIterateResult?: IterateResultBuilder;
}): CurrencyBridge["scanAccounts"] => {
  return commonMakeScanAccounts({
    getAccountShape,
    buildIterateResult,
    getAddressFn: getAddr,
  });
};

export function makeAccountBridgeReceive({
  injectGetAddressParams,
}: {
  injectGetAddressParams?: (account: Account) => any;
} = {}): (
  account: Account,
  option: {
    verify?: boolean;
    deviceId: string;
    subAccountId?: string;
    freshAddressIndex?: number;
  },
) => Observable<{
  address: string;
  path: string;
}> {
  return commonMakeAccountBridgeReceive(getAddr, {
    injectGetAddressParams,
  });
}
