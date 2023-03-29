import {
  GetAccountShape,
  IterateResultBuilder,
  makeAccountBridgeReceive as commonMakeAccountBridgeReceive,
  makeScanAccounts as commonMakeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddress from "../hw/getAddress";
import { withDevice } from "../hw/deviceAccess";
import { Account, CurrencyBridge } from "@ledgerhq/types-live";
import { Observable, from } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { GetAddressOptions, Result } from "@ledgerhq/coin-framework/derivation";

export {
  AccountShapeInfo,
  GetAccountShape,
  IterateResultBuilder,
  makeSync,
  mergeNfts,
  mergeOps,
  sameOp,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";

function getAddr(opts: GetAddressOptions): Promise<Result> {
  return withDevice("")((transport: Transport) => from(getAddress(transport, opts))).toPromise();
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
