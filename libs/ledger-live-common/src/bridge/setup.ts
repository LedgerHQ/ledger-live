// Goal of this file is to provide utils for injecting device/signer dependency to coin-modules.

import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { PassthroughFn, SignerContext } from "@ledgerhq/coin-framework/signer";
import Transport from "@ledgerhq/hw-transport";
import { from } from "rxjs";
import { withDevice } from "../hw/deviceAccess";
import { GetAddressOptions, Resolver, Result } from "../hw/getAddress/types";

export type CreateSigner<T> = (transport: Transport) => T;
export type CoinResolver<T, U> = (signerContext: SignerContext<T, U>) => GetAddressFn;

/**
 * Retrieve `transport` to provide it to the signer and give some sort of scope for which the `transport` will be valid.
 * @param signerFactory
 * @returns SignerContext
 */
export function executeWithSigner<T, U>(signerFactory: CreateSigner<T>): SignerContext<T, U> {
  return (deviceId: string, fn: PassthroughFn<T, U>): Promise<U> =>
    withDevice(deviceId)(transport => from(fn(signerFactory(transport)))).toPromise();
}

/**
 * Inject the `signer` so it can be used by the resolver function.
 * @param signer
 * @param coinResolver
 * @returns Resolver
 */
export function createResolver<T, U>(
  signer: CreateSigner<T>,
  coinResolver: CoinResolver<T, U>,
): Resolver {
  return (transport: Transport, opts: GetAddressOptions): Promise<Result> => {
    const signerContext: SignerContext<T, U> = (_, fn) => fn(signer(transport));
    return coinResolver(signerContext)("", opts);
  };
}
