import { Observable, from, of } from "rxjs";
import {
  GetAccountShape,
  IterateResultBuilder,
  makeAccountBridgeReceive as commonMakeAccountBridgeReceive,
  makeScanAccounts as commonMakeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { SignerFactory } from "@ledgerhq/coin-framework/signer";
import { Account, CurrencyBridge } from "@ledgerhq/types-live";
import { GetAddressOptions, Result } from "@ledgerhq/coin-framework/derivation";
import Transport from "@ledgerhq/hw-transport";
import { withDevice, withDevicePromise } from "../hw/deviceAccess";
import getAddress from "../hw/getAddress";
import { Resolver } from "../hw/getAddress/types";

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

type CreateSigner<T> = (transport) => T;

export function signerFactory<T>(signer: CreateSigner<T>): SignerFactory<T> {
  return async (deviceId: string) => {
    return await withDevicePromise(deviceId, (transport) =>
      of(signer(transport))
    );
  };
}

type CoinResolver<T> = (signerFactory: SignerFactory<T>) => GetAddressFn;
export function createResolver<T>(
  signer: CreateSigner<T>,
  coinResolver: CoinResolver<T>
): Resolver {
  return async (
    transport: Transport,
    opts: GetAddressOptions
  ): Promise<Result> => {
    const signerFactory = (_: string) => Promise.resolve(signer(transport));
    return coinResolver(signerFactory)("", opts);
  };
}
