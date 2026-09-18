import type { TrustchainState } from "./schema";

type TrustchainRoot = {
  readonly trustchain: TrustchainState;
};

export const trustchainStateSelector = (state: TrustchainRoot): TrustchainState => state.trustchain;

export const trustchainSelector = (state: TrustchainRoot) => state.trustchain.trustchain;

export const memberKeySelector = (state: TrustchainRoot) => state.trustchain.memberKey;
