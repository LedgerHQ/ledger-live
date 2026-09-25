import { LkrpNotImplementedError } from "@shared/lkrp";

export type LkrpIdentityStore = {
  readonly memberKeyId: string | null;
  readonly trustchainRootId: string | null;
};

export type LkrpIdentityProvider = {
  readonly brokerId: "lkrp";
  authenticate(request: { readonly challenge: unknown }): Promise<never>;
};

export function createLkrpIdentityProvider(
  _loadStore: () => Promise<LkrpIdentityStore | null> | LkrpIdentityStore | null,
): LkrpIdentityProvider {
  return {
    brokerId: "lkrp",
    authenticate: () => Promise.reject(new LkrpNotImplementedError("createLkrpIdentityProvider")),
  };
}
