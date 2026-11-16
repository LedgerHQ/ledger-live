import { TrustchainMemberId } from "@features/platform-intent-wallet-sync";
import type { WalletSyncIntentToolProps } from "../src/types";

export function memberId(id: string): TrustchainMemberId {
  return TrustchainMemberId.parse(id);
}

export function buildProps(
  overrides: Partial<WalletSyncIntentToolProps> = {},
): WalletSyncIntentToolProps {
  return {
    status: "idle",
    hasMemberCredentials: true,
    hasTrustchain: true,
    members: null,
    log: [],
    onAddMember: jest.fn(),
    onRemoveMember: jest.fn(),
    onRefreshMembers: jest.fn(),
    onClearLog: jest.fn(),
    ...overrides,
  };
}
