import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useEntryPoint } from "./useEntryPoint";
import { EntryPoint } from "../types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { INITIAL_STATE } from "../__tests__/shared";

describe("useEntryPoint", () => {
  it("shouldDisplayEntryPoint should be false when lldWalletSync ff is disabled", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        ...withFlagOverrides({ lldWalletSync: { enabled: false } }),
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when lldLedgerSyncEntryPoints ff is disabled", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        ...withFlagOverrides({ lldLedgerSyncEntryPoints: { enabled: false } }),
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
        ...withFlagOverrides({
          lldLedgerSyncEntryPoints: {
            enabled: true,
            params: { onboarding: true, manager: false, accounts: true, settings: true, postOnboarding: true },
          },
        }),
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

  it("shouldDisplayEntryPoint should be false when lastSeenDevice and lastOnboardedDevice are both unset", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          lastSeenDevice: null,
          lastOnboardedDevice: null,
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be true when lastSeenDevice is unset but lastOnboardedDevice is eligible", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          lastSeenDevice: null,
          lastOnboardedDevice: {
            deviceId: "",
            modelId: DeviceModelId.stax,
            wired: false,
          } as Device,
        },
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(true);
  });

  it("shouldDisplayEntryPoint should be false when lastSeenDevice is unset and lastOnboardedDevice is a nanoS", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      initialState: {
        ...INITIAL_STATE,
        settings: {
          ...INITIAL_STATE.settings,
          lastSeenDevice: null,
          lastOnboardedDevice: {
            deviceId: "",
            modelId: DeviceModelId.nanoS,
            wired: false,
          } as Device,
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
