/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import type { ServerConfig } from "@ledgerhq/wallet-api-server";
import { useConfig } from "../useConfig";

function createConfig(overrides?: Partial<ServerConfig>): ServerConfig {
  return {
    appId: "app-id",
    userId: "user-id",
    tracking: false,
    wallet: { name: "ledger-live-desktop", version: "1.0.0" },
    ...overrides,
  };
}

describe("useConfig", () => {
  it("returns the config fields", () => {
    const config = createConfig();
    const { result } = renderHook(() => useConfig(config));

    expect(result.current).toEqual({
      appId: "app-id",
      userId: "user-id",
      tracking: false,
      wallet: { name: "ledger-live-desktop", version: "1.0.0" },
      mevProtected: undefined,
    });
  });

  it("passes mevProtected through", () => {
    const config = createConfig({ mevProtected: true });
    const { result } = renderHook(() => useConfig(config));

    expect(result.current.mevProtected).toBe(true);
  });

  it("memoizes the result across re-renders with stable dependencies", () => {
    // dependencies are compared by reference, so reuse the same wallet object
    const wallet = { name: "ledger-live-desktop", version: "1.0.0" };
    const { result, rerender } = renderHook(props => useConfig(props), {
      initialProps: createConfig({ wallet }),
    });
    const first = result.current;

    rerender(createConfig({ wallet }));
    expect(result.current).toBe(first);
  });

  it("returns a new object when a dependency changes", () => {
    const { result, rerender } = renderHook(props => useConfig(props), {
      initialProps: createConfig(),
    });
    const first = result.current;

    rerender(createConfig({ userId: "other-user" }));
    expect(result.current).not.toBe(first);
    expect(result.current.userId).toBe("other-user");
  });
});
