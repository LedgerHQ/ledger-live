import { Observable, from } from "rxjs";
import {
  GetAccountShape,
  IterateResultBuilder,
  makeAccountBridgeReceive as commonMakeAccountBridgeReceive,
  makeScanAccounts as commonMakeScanAccounts,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import { Account, CurrencyBridge } from "@ledgerhq/types-live";
import { GetAddressOptions, Result } from "@ledgerhq/coin-framework/derivation";
import Transport from "@ledgerhq/hw-transport";
import { withDevice } from "../hw/deviceAccess";
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

export function executeWithSigner<T, U>(signerFactory: CreateSigner<T>): SignerContext<T, U> {
  return (deviceId: string, fn: (signer: T) => Promise<U>): Promise<U> =>
    withDevice(deviceId)(transport => {
      const signer = signerFactory(transport);
      return from(fn(signer));
    }).toPromise();
}

type CoinResolver<T, U> = (signerContext: SignerContext<T, U>) => GetAddressFn;
export function createResolver<T, U>(
  signer: CreateSigner<T>,
  coinResolver: CoinResolver<T, U>,
): Resolver {
  return async (transport: Transport, opts: GetAddressOptions): Promise<Result> => {
    const signerContext = (_: string, fn: (signer: T) => Promise<U>): Promise<U> => {
      return fn(signer(transport));
    };
    return coinResolver(signerContext)("", opts);
  };
}
