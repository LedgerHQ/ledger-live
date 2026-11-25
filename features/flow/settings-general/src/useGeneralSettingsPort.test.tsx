import React, { type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { SettingsPortProvider } from "@features/flow-settings";
import { createFakeGeneralPort } from "./__tests__/fakeGeneralPort";
import { useGeneralSettingsPort, useRegionSettingsPort } from "./useGeneralSettingsPort";

function wrapperFor(port: ReturnType<typeof createFakeGeneralPort>["port"]) {
  return ({ children }: { children: ReactNode }) => (
    <SettingsPortProvider value={port}>{children}</SettingsPortProvider>
  );
}

describe("useGeneralSettingsPort", () => {
  it("gives the General section its values and the data the app provides", () => {
    const { port, ledgerSyncOpenings } = createFakeGeneralPort(undefined, {
      isLedgerSyncActive: true,
    });

    const { result } = renderHook(() => useGeneralSettingsPort(), { wrapper: wrapperFor(port) });

    expect(result.current.values.language).toBe("en");
    expect(result.current.languages).toEqual([
      { value: "en", label: "English" },
      { value: "fr", label: "Français" },
    ]);
    expect(result.current.ledgerSync.isActive).toBe(true);

    result.current.ledgerSync.open();
    expect(ledgerSyncOpenings.count).toBe(1);
  });
});

describe("useRegionSettingsPort", () => {
  it("gives the Region its value and records its changes", () => {
    const { port, updates } = createFakeGeneralPort({ region: "fr-FR" });

    const { result } = renderHook(() => useRegionSettingsPort(), { wrapper: wrapperFor(port) });

    expect(result.current.values.region).toBe("fr-FR");
    result.current.setValue({ key: "region", value: "en-US" });
    expect(updates).toEqual([{ key: "region", value: "en-US" }]);
  });
});
