import type Transport from "@ledgerhq/hw-transport";
import type { SignerContext } from "@ledgerhq/coin-framework/signer";
import type { GetViewKeyFn, GetViewKeyOptions } from "@ledgerhq/coin-aleo/signer/getViewKey";
import type { CreateSigner } from "../../../../bridge/setup";
import type { Resolver } from "./types";

export type ViewKeyResolver<T> = (signerContext: SignerContext<T>) => GetViewKeyFn;

/**
 * Inject the `signer` so it can be used by the resolver function.
 * @param signerFactory
 * @param viewKeyResolver
 * @returns Resolver
 */
export function createViewKeyResolver<T>(
  signerFactory: CreateSigner<T>,
  viewKeyResolver: ViewKeyResolver<T>,
): Resolver {
  return (transport: Transport, opts: GetViewKeyOptions): ReturnType<GetViewKeyFn> => {
    const signerContext: SignerContext<T> = (_, fn) => fn(signerFactory(transport));
    return viewKeyResolver(signerContext)("", opts);
  };
}
