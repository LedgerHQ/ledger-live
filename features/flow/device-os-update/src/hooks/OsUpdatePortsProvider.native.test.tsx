import React from "react";
import { renderHook } from "@testing-library/react-native";
import { createFakePorts } from "../__tests__/render";
import { OsUpdatePortsProvider, useOsUpdatePorts } from "./OsUpdatePortsProvider";

describe("OsUpdatePortsProvider", () => {
  it("gives the flow the ports of the app", () => {
    const ports = createFakePorts();

    const { result } = renderHook(() => useOsUpdatePorts(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <OsUpdatePortsProvider ports={ports}>{children}</OsUpdatePortsProvider>
      ),
    });

    expect(result.current).toBe(ports);
  });

  it("fails outside a provider, so a missing app wiring is caught at once", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useOsUpdatePorts())).toThrow(
      "useOsUpdatePorts must be used inside an OsUpdatePortsProvider",
    );
  });
});
