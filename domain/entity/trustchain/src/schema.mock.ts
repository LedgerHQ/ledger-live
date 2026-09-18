import type { Trustchain, TrustchainMemberKey, TrustchainState } from "./schema";

const defaultMemberKey: TrustchainMemberKey = {
  id: "member-key",
  publicKey: "02".padEnd(66, "0"),
};

const defaultTrustchain: Trustchain = {
  rootId: "root",
  applicationPath: "m/0'/16'/0'",
};

export function makeTrustchainMemberKey(
  overrides: Partial<TrustchainMemberKey> = {},
): TrustchainMemberKey {
  return { ...defaultMemberKey, ...overrides };
}

export function makeTrustchain(overrides: Partial<Trustchain> = {}): Trustchain {
  return { ...defaultTrustchain, ...overrides };
}

export function makeTrustchainState(overrides: Partial<TrustchainState> = {}): TrustchainState {
  return {
    trustchain: defaultTrustchain,
    memberKey: defaultMemberKey,
    ...overrides,
  };
}
