import {
  GetAccountShape,
  IterateResultBuilder,
  makeAccountBridgeReceive as commonMakeAccountBridgeReceive,
  makeScanAccounts as commonMakeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddress from "../hw/getAddress";
import { withDevice } from "../hw/deviceAccess";
import { Account, CurrencyBridge } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { GetAddressOptions, Result } from "@ledgerhq/coin-framework/derivation";
import { Resolver } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";

export {
  AccountShapeInfo,
  GetAccountShape,
  IterateResultBuilder,
  makeSync,
  mergeNfts,
  mergeOps,
  sameOp,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";

export const makeScanAccounts = ({
  getAccountShape,
  buildIterateResult,
  getAddressFn,
}: {
  getAccountShape: GetAccountShape;
  buildIterateResult?: IterateResultBuilder;
  getAddressFn?: (
    transport: Transport
  ) => (opts: GetAddressOptions) => Promise<Result>;
}): CurrencyBridge["scanAccounts"] => {
  const getAddr: Resolver = (transport: Transport, opts: GetAddressOptions) => {
    return getAddressFn
      ? getAddressFn(transport)(opts)
      : getAddress(transport, opts);
  };

  return commonMakeScanAccounts({
    getAccountShape,
    deviceCommunication: withDevice,
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
  }
) => Observable<{
  address: string;
  path: string;
}> {
  return commonMakeAccountBridgeReceive(getAddress, withDevice, {
    injectGetAddressParams,
  });
}
