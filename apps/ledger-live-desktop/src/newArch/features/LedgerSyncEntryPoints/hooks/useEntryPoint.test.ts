import { renderHook } from "tests/testSetup";
import { useEntryPoint } from "./useEntryPoint";
import { EntryPoint } from "../types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { INITIAL_STATE } from "../__tests__/shared";

describe("useEntryPoint", () => {
  it("shouldDisplayEntryPoint should be false when lldWalletSync ff is disabled", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          overriddenFeatureFlags: {
            lldWalletSync: {
              enabled: false,
            },
          },
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when lldLedgerSyncEntryPoints ff is disabled", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          overriddenFeatureFlags: {
            lldLedgerSyncEntryPoints: {
              enabled: false,
            },
          },
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be true when all criterias are met", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: INITIAL_STATE,
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(true);
  });

  it("shouldDisplayEntryPoint should be false when the entry point has been individually disabled in the ff", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.manager), {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          overriddenFeatureFlags: {
            lldLedgerSyncEntryPoints: {
              enabled: true,
              params: {
                onboarding: true,
                manager: false,
                accounts: true,
                settings: true,
              },
            },
          },
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when lastSeenDevice is a nanoS", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          lastSeenDevice: {
            modelId: DeviceModelId.nanoS,
          } as DeviceModelInfo,
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when lastSeenDevice is unset", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          lastSeenDevice: null,
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when a trustchain is set", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        trustchain: {
          ...INITIAL_STATE.trustchain,
          trustchain: {
            rootId: "rootId",
            applicationPath: "applicationPath",
            walletSyncEncryptionKey: "walletSyncEncryptionKey",
          },
          memberCredentials: {
            privatekey: "privatekey",
            pubkey: "pubkey",
          },
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when a trustchain is set", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        trustchain: {
          ...INITIAL_STATE.trustchain,
          trustchain: {
            rootId: "rootId",
            applicationPath: "applicationPath",
            walletSyncEncryptionKey: "walletSyncEncryptionKey",
          },
          memberCredentials: {
            privatekey: "privatekey",
            pubkey: "pubkey",
          },
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });
});
