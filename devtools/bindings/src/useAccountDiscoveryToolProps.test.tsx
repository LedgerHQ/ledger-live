import React, { type PropsWithChildren } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { accountDataExtra, type AccountDataSource } from "@domain/api-account-data";
import { AccountDataSourceIdSchema } from "@domain/entity-account-data";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import type { DeriveAccount } from "@features/platform-account-discovery";
import { useAccountDiscoveryToolProps } from "./useAccountDiscoveryToolProps";

const derive: DeriveAccount = async candidate =>
  AccountDescriptorSchema.parse({
    purpose: "account",
    version: "2",
    type: "address",
    network: candidate.network,
    address: `0x${candidate.derivationMode}${candidate.index}`,
    path: candidate.addressPath,
  });

const chain: AccountDataSource = {
  id: AccountDataSourceIdSchema.parse("chain"),
  supports: () => true,
  read: {
    existence: async ({ descriptor }) => ({
      used: descriptor.type === "address" && descriptor.address === "0x0",
    }),
  },
};

function setup(inputs: Partial<Parameters<typeof useAccountDiscoveryToolProps>[0]> = {}) {
  const store = configureStore({
    reducer: { noop: (state: null = null) => state },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ thunk: { extraArgument: accountDataExtra([chain]) } }),
  });
  const wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>{children}</Provider>
  );
  return renderHook(
    () =>
      useAccountDiscoveryToolProps({
        currencies: [{ id: "ethereum", name: "Ethereum" }],
        derive,
        blockedReason: "No device",
        ...inputs,
      }),
    { wrapper },
  );
}

describe("useAccountDiscoveryToolProps", () => {
  it("is blocked without a device", () => {
    const { result } = setup({ derive: undefined });
    expect(result.current.blockedReason).toBe("No device");
  });

  it("scans through the app's account data sources and counts what it cost", async () => {
    const { result } = setup();
    expect(result.current.blockedReason).toBeUndefined();
    act(() => result.current.onScan("ethereum", { window: 1, lookahead: 1 }));
    expect(result.current.state.status).toBe("scanning");
    await waitFor(() => expect(result.current.state.status).toBe("done"));
    const rows = result.current.state.rows.map(({ derivationMode, index, used }) => [
      derivationMode,
      index,
      used,
    ]);
    expect(rows).toContainEqual(["", 0, true]);
    expect(rows).toContainEqual(["", 1, false]);
    expect(result.current.state.counters.existenceChecks).toBeGreaterThan(0);
    expect(result.current.state.counters.derivations).toBe(
      result.current.state.counters.existenceChecks,
    );
  });

  it("marks a scan stopped by the user, with what it cost so far", async () => {
    const { result } = setup({ derive: () => new Promise(() => undefined) });
    act(() => result.current.onScan("ethereum", { window: 1, lookahead: 1 }));
    act(() => result.current.onStop());
    expect(result.current.state.status).toBe("stopped");
    expect(result.current.state.elapsedMs).toBeGreaterThanOrEqual(0);
  });
});
