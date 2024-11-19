// Goal of this file is to provide utils for injecting device/signer dependency to coin-modules.

import { firstValueFrom, from } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { PassthroughFn, SignerContext } from "@ledgerhq/coin-framework/signer";
import { MessageSignerFn, SignMessage } from "../hw/signMessage/types";
import { GetAddressOptions, Resolver } from "../hw/getAddress/types";
import { withDevice } from "../hw/deviceAccess";

export type CreateSigner<T> = (transport: Transport) => T;
export type CoinResolver<T> = (signerContext: SignerContext<T>) => GetAddressFn;
export type MessageSigner<T> = (signerContext: SignerContext<T>) => MessageSignerFn;

/**
 * Retrieve `transport` to provide it to the signer and give some sort of scope for which the `transport` will be valid.
 * @param signerFactory
 * @returns SignerContext
 */
export function executeWithSigner<T>(signerFactory: CreateSigner<T>): SignerContext<T> {
  return <U>(deviceId: string, fn: PassthroughFn<T, U>): Promise<U> =>
    firstValueFrom(withDevice(deviceId)(transport => from(fn(signerFactory(transport)))));
}

/**
 * Inject the `signer` so it can be used by the resolver function.
 * @param signer
 * @param coinResolver
 * @returns Resolver
 */
export function createResolver<T>(
  signerFactory: CreateSigner<T>,
  coinResolver: CoinResolver<T>,
): Resolver {
  return (transport: Transport, opts: GetAddressOptions): ReturnType<GetAddressFn> => {
    const signerContext: SignerContext<T> = (_, fn) => fn(signerFactory(transport));
    return coinResolver(signerContext)("", opts);
  };
}

/**
 * Inject the `signer` so it can be used by the hw-signMessage function.
 */
export function createMessageSigner<T>(
  signerFactory: CreateSigner<T>,
  messageSigner: MessageSigner<T>,
): SignMessage {
  return (transport, account, messageData) => {
    const signerContext: SignerContext<T> = (_, fn) => fn(signerFactory(transport));
    return messageSigner(signerContext)("", account, messageData);
  };
}
