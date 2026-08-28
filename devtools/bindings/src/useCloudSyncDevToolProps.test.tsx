import React, { type PropsWithChildren } from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { useCloudSyncDevToolProps } from "./useCloudSyncDevToolProps";

const TRUSTCHAIN = { rootId: "root", walletSyncEncryptionKey: "key", applicationPath: "path" };
const MEMBER_CREDENTIALS = { pubkey: "pub", privatekey: "priv" };

function buildStore(trustchainState?: { trustchain: unknown; memberCredentials: unknown }) {
  return configureStore({
    reducer: {
      trustchain: (state = trustchainState ?? null) => state,
    },
  });
}

function withStore(store: ReturnType<typeof buildStore>) {
  return ({ children }: PropsWithChildren) => <Provider store={store}>{children}</Provider>;
}

const mockCreateSdk = jest.fn(() => ({}) as never);

describe("useCloudSyncDevToolProps", () => {
  it("should return null trustchain and memberCredentials when store has no values", () => {
    const store = buildStore();
    const { result } = renderHook(
      () =>
        useCloudSyncDevToolProps(mockCreateSdk, "http://cloud-sync.test", "http://trustchain.test"),
      { wrapper: withStore(store) },
    );
    expect(result.current.liveState!.trustchain).toBeNull();
    expect(result.current.liveState!.memberCredentials).toBeNull();
  });

  it("should return trustchain and memberCredentials from store", () => {
    const store = buildStore({ trustchain: TRUSTCHAIN, memberCredentials: MEMBER_CREDENTIALS });
    const { result } = renderHook(
      () =>
        useCloudSyncDevToolProps(mockCreateSdk, "http://cloud-sync.test", "http://trustchain.test"),
      { wrapper: withStore(store) },
    );
    expect(result.current.liveState!.trustchain).toEqual(TRUSTCHAIN);
    expect(result.current.liveState!.memberCredentials).toEqual(MEMBER_CREDENTIALS);
  });

  it("should pass through createSdk, cloudSyncApiBaseUrl and trustchainApiBaseUrl", () => {
    const store = buildStore();
    const { result } = renderHook(
      () =>
        useCloudSyncDevToolProps(mockCreateSdk, "http://cloud-sync.test", "http://trustchain.test"),
      { wrapper: withStore(store) },
    );
    expect(result.current.createSdk).toBe(mockCreateSdk);
    expect(result.current.cloudSyncApiBaseUrl).toBe("http://cloud-sync.test");
    expect(result.current.trustchainApiBaseUrl).toBe("http://trustchain.test");
  });

  it("should pass through optional useProd and setUseProd", () => {
    const store = buildStore();
    const setUseProd = jest.fn();
    const { result } = renderHook(
      () =>
        useCloudSyncDevToolProps(
          mockCreateSdk,
          "http://cloud-sync.test",
          "http://trustchain.test",
          true,
          setUseProd,
        ),
      { wrapper: withStore(store) },
    );
    expect(result.current.useProd).toBe(true);
    expect(result.current.setUseProd).toBe(setUseProd);
  });
});
