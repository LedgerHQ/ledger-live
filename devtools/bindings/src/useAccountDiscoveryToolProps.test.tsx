import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createAccountDataRouter } from "@domain/api-account-data-source";
import { useAccountDiscoveryToolProps } from "./useAccountDiscoveryToolProps";

const usedAddresses = new Set(["addr-0", "addr-1"]);

const setup = (derive?: Parameters<typeof useAccountDiscoveryToolProps>[0]["derive"]) => {
  const accountData = createAccountDataRouter([
    {
      id: "fake",
      supports: () => true,
      exists: async ({ descriptor }) =>
        descriptor.type === "address" && usedAddresses.has(descriptor.address),
    },
  ]);
  const store = configureStore({
    reducer: { nothing: (state: null = null) => state },
    middleware: getDefault => getDefault({ thunk: { extraArgument: { accountData } } }),
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const inputs = {
    currencies: [{ id: "ethereum", name: "Ethereum" }],
    derive,
    blockedReason: "Select a device",
  };
  return { wrapper, inputs };
};

describe("useAccountDiscoveryToolProps", () => {
  it("is blocked, with the reason, when there is no way to derive", () => {
    const { wrapper, inputs } = setup(undefined);
    const { result } = renderHook(() => useAccountDiscoveryToolProps(inputs), { wrapper });
    expect(result.current.blockedReason).toBe("Select a device");
    act(() => result.current.onScan("ethereum", { lookahead: 1 }));
    expect(result.current.state.status).toBe("idle");
  });

  it("streams the discovered accounts and counts what the scan cost", async () => {
    const derive = jest.fn(async ({ index }: { index: number }) => ({
      type: "address" as const,
      address: `addr-${index}`,
    }));
    const { wrapper, inputs } = setup(derive);
    const { result } = renderHook(() => useAccountDiscoveryToolProps({ ...inputs, derive }), {
      wrapper,
    });

    act(() => result.current.onScan("ethereum", { lookahead: 2 }));
    expect(result.current.state.status).toBe("scanning");

    await waitFor(() => expect(result.current.state.status).toBe("done"));
    const { rows, counters } = result.current.state;
    expect(rows.filter(row => row.used).map(row => row.address)).toEqual(
      expect.arrayContaining(["addr-0", "addr-1"]),
    );
    expect(rows.some(row => !row.used)).toBe(true);
    expect(counters.derivations).toBeGreaterThanOrEqual(rows.length);
    expect(counters.existenceChecks).toBeGreaterThanOrEqual(rows.length);
  });

  it("reports an error from the device", async () => {
    const derive = jest.fn(async () => {
      throw new Error("device locked");
    });
    const { wrapper, inputs } = setup(derive);
    const { result } = renderHook(() => useAccountDiscoveryToolProps({ ...inputs, derive }), {
      wrapper,
    });
    act(() => result.current.onScan("ethereum", { lookahead: 1 }));
    await waitFor(() => expect(result.current.state.status).toBe("error"));
    expect(result.current.state.error).toBe("device locked");
  });

  it("stops the scan", async () => {
    const derive = jest.fn(() => new Promise<never>(() => undefined));
    const { wrapper, inputs } = setup(derive);
    const { result } = renderHook(() => useAccountDiscoveryToolProps({ ...inputs, derive }), {
      wrapper,
    });
    act(() => result.current.onScan("ethereum", { lookahead: 1 }));
    act(() => result.current.onStop());
    expect(result.current.state.status).toBe("done");
  });
});
