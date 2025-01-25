import { firstValueFrom, from } from "rxjs";
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
  return firstValueFrom(
    withDevice(deviceId)((transport: Transport) => from(getAddress(transport, opts))),
  );
}

export const makeScanAccounts = <A extends Account = Account>({
  getAccountShape,
  buildIterateResult,
}: {
  getAccountShape: GetAccountShape<A>;
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
} = {}) {
  return commonMakeAccountBridgeReceive(getAddr, {
    injectGetAddressParams,
  });
}
