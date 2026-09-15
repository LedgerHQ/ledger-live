import type { PayCardProviderAppState } from "./types";

type PayCardProviderAppStateRoot = {
  payCardProviderApp: PayCardProviderAppState;
};

/**
 * True while the holder belongs to the provider's US tenant. The app id to compare against comes
 * from the caller, which reads it on every request, so a value changed in the debug settings takes
 * effect without a new login.
 *
 * An empty `usAppId` is the shipped default and names no tenant, so it must never match a redirect
 * that carried no app id either.
 */
export function selectPayCardIsUsEnv(state: PayCardProviderAppStateRoot, usAppId: string): boolean {
  return usAppId !== "" && state.payCardProviderApp.providerAppId === usAppId;
}

export function payCardProviderAppPersistedSelector(
  state: PayCardProviderAppStateRoot,
): PayCardProviderAppState {
  return {
    providerAppId: state.payCardProviderApp.providerAppId,
  };
}
