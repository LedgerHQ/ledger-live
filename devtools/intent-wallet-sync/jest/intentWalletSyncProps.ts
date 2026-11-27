import type { KeyRingMemberId } from "@features/platform-key-ring";
import type { WalletSyncIntentToolProps } from "../src/types";

// A runtime import of the key ring barrel loads the device crypto, which this preset cannot load.
export function memberId(id: string): KeyRingMemberId {
  return id as KeyRingMemberId;
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
