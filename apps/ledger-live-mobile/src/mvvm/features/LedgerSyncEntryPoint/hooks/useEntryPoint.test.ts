import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useEntryPoint } from "./useEntryPoint";
import { EntryPoint } from "../types";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";
import { State } from "~/reducers/types";

const entryPointsVisibleState = withFlagOverrides(
  {
    llmWalletSync: {
      enabled: true,
      params: {
        environment: "STAGING",
        watchConfig: {},
      },
    },
    llmLedgerSyncEntryPoints: {
      enabled: true,
      params: {
        manager: false,
        accounts: true,
        settings: true,
        postOnboarding: true,
      },
    },
  },
  state => ({
    ...state,
    settings: {
      ...state.settings,
      readOnlyModeEnabled: false,
      seenDevices: [
        {
          modelId: DeviceModelId.stax,
        } as DeviceModelInfo,
      ],
    },
    trustchain: {
      trustchain: null,
      memberCredentials: null,
    },
  }),
);

describe("useEntryPoint", () => {
  it("shouldDisplayEntryPoint should be false when llmWalletSync ff is disabled", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      overrideInitialState: withFlagOverrides({ llmWalletSync: { enabled: false } }, s =>
        entryPointsVisibleState(s),
      ),
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when the postOnboarding entry point is disabled in llmLedgerSyncEntryPoints ff params", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.postOnboarding), {
      overrideInitialState: withFlagOverrides(
        {
          llmLedgerSyncEntryPoints: {
            enabled: true,
            params: {
              manager: true,
              accounts: true,
              settings: true,
              postOnboarding: false,
            },
          },
        },
        s => entryPointsVisibleState(s),
      ),
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be true when all criterias are met", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      overrideInitialState: entryPointsVisibleState,
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(true);
  });

  it("shouldDisplayEntryPoint should be false when the entry point has been individually disabled in the ff", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.manager), {
      overrideInitialState: entryPointsVisibleState,
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when the entry point has been individually disabled in the ff params", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.postOnboarding), {
      overrideInitialState: withFlagOverrides({ llmWalletSync: { enabled: false } }, s =>
        entryPointsVisibleState(s),
      ),
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when lastSeenDevice is a nanoS", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      overrideInitialState: (state: State) => {
        const newState = entryPointsVisibleState(state);
        return {
          ...newState,
          settings: {
            ...newState.settings,
            seenDevices: [
              {
                modelId: DeviceModelId.nanoS,
              } as DeviceModelInfo,
            ],
          },
        };
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when lastSeenDevice is unset", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      overrideInitialState: (state: State) => {
        const newState = entryPointsVisibleState(state);
        return {
          ...newState,
          settings: {
            ...newState.settings,
            seenDevices: [],
          },
        };
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when a trustchain is set", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      overrideInitialState: (state: State) => {
        const newState = entryPointsVisibleState(state);
        return {
          ...newState,
          trustchain: {
            ...newState.trustchain,
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
        };
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });

  it("shouldDisplayEntryPoint should be false when a trustchain is set", async () => {
    const { result } = renderHook(() => useEntryPoint(EntryPoint.accounts), {
      overrideInitialState: (state: State) => {
        const newState = entryPointsVisibleState(state);
        return {
          ...newState,
          trustchain: {
            ...newState.trustchain,
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
        };
      },
    });

    expect(result.current.shouldDisplayEntryPoint).toBe(false);
  });
});
