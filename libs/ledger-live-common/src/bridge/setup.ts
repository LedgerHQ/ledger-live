// Goal of this file is to provide utils for injecting device/signer dependency to coin-modules.

import { firstValueFrom, from } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { GetAddressFn } from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { PassthroughFn, SignerContext } from "@ledgerhq/coin-framework/signer";
import { MessageSignerFn, SignMessage } from "../hw/signMessage/types";
import { GetAddressOptions, Resolver } from "../hw/getAddress/types";
import { withDevice } from "../hw/deviceAccess";

export type CreateSigner<T> = (transport: Transport) => T;
export type CoinResolver<T, U> = (signerContext: SignerContext<T, U>) => GetAddressFn;
export type MessageSigner<T, U> = (signerContext: SignerContext<T, U>) => MessageSignerFn;

/**
 * Retrieve `transport` to provide it to the signer and give some sort of scope for which the `transport` will be valid.
 * @param signerFactory
 * @returns SignerContext
 */
export function executeWithSigner<T, U>(signerFactory: CreateSigner<T>): SignerContext<T, U> {
  return (deviceId: string, fn: PassthroughFn<T, U>): Promise<U> =>
    firstValueFrom(withDevice(deviceId)(transport => from(fn(signerFactory(transport)))));
}

/**
 * Inject the `signer` so it can be used by the resolver function.
 * @param signer
 * @param coinResolver
 * @returns Resolver
 */
export function createResolver<T, U>(
  signerFactory: CreateSigner<T>,
  coinResolver: CoinResolver<T, U>,
): Resolver {
  return (transport: Transport, opts: GetAddressOptions): ReturnType<GetAddressFn> => {
    const signerContext: SignerContext<T, U> = (_, fn) => fn(signerFactory(transport));
    return coinResolver(signerContext)("", opts);
  };
}

/**
 * Inject the `signer` so it can be used by the hw-signMessage function.
 */
export function createMessageSigner<T, U>(
  signerFactory: CreateSigner<T>,
  messageSigner: MessageSigner<T, U>,
): SignMessage {
  return (transport, account, messageData) => {
    const signerContext: SignerContext<T, U> = (_, fn) => fn(signerFactory(transport));
    return messageSigner(signerContext)("", account, messageData);
  };
}
