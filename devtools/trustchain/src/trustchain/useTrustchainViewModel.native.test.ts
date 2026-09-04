import { renderHook, act } from "@support/jest-devtools/native";
import { useTrustchainViewModel } from "./useTrustchainViewModel";
import type { TrustchainDevToolProps, TrustchainSDK } from "../types";

function buildSdk(): TrustchainSDK {
  return {
    initMemberCredentials: jest.fn(),
    getOrCreateTrustchain: jest.fn(),
    restoreTrustchain: jest.fn(),
    getMembers: jest.fn(),
    removeMember: jest.fn(),
    destroyTrustchain: jest.fn(),
    destroyApplication: jest.fn(),
    encryptUserData: jest.fn(),
    decryptUserData: jest.fn(),
    invalidateJwt: jest.fn(),
  };
}

function buildProps(overrides: Partial<TrustchainDevToolProps> = {}): TrustchainDevToolProps {
  return {
    createSdk: () => buildSdk(),
    liveState: null,
    trustchainApiBaseUrl: "http://trustchain.test",
    ...overrides,
  };
}

describe("useTrustchainViewModel (native)", () => {
  it("starts with deviceId = webhid", () => {
    const { result } = renderHook(() => useTrustchainViewModel(buildProps()));
    expect(result.current.deviceId).toBe("webhid");
  });

  it("callbacks toggle deviceInteractionVisible on/off", () => {
    const { result } = renderHook(() => useTrustchainViewModel(buildProps()));
    act(() => result.current.callbacks.onStartRequestUserInteraction?.());
    expect(result.current.deviceInteractionVisible).toBe(true);
    act(() => result.current.callbacks.onEndRequestUserInteraction?.());
    expect(result.current.deviceInteractionVisible).toBe(false);
  });

  it("setTrustchain propagates via onTrustchainChange", () => {
    const onTrustchainChange = jest.fn();
    const { result } = renderHook(() => useTrustchainViewModel(buildProps({ onTrustchainChange })));
    const tc = { rootId: "root", walletSyncEncryptionKey: "key", applicationPath: "path" };
    act(() => result.current.setTrustchain(tc));
    expect(onTrustchainChange).toHaveBeenCalledWith(tc);
  });

  it("seeds trustchain from liveState on mount", () => {
    const trustchain = { rootId: "root", walletSyncEncryptionKey: "key", applicationPath: "path" };
    const memberCredentials = { pubkey: "pub", privatekey: "priv" };
    const { result } = renderHook(() =>
      useTrustchainViewModel(buildProps({ liveState: { trustchain, memberCredentials } })),
    );
    expect(result.current.trustchain).toEqual(trustchain);
  });
});
