import type { WalletSyncIntentToolProps } from "../src/types";

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
