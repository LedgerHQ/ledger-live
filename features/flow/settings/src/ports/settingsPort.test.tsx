import React, { type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { SettingsPortMissing } from "./errors";
import {
  SettingsPortProvider,
  useSetting,
  useSettingsPort,
  useUpdateSetting,
} from "./settingsPort";
import { createFakePort, createFakeSettingsPort } from "./testing/fakeSettingsPort";
import type { SettingsPort, UpdateOf } from "./types";

describe("useSetting", () => {
  it("returns the value the app provides for the key", () => {
    const { port } = createFakeSettingsPort({ theme: "dark" });

    const { result } = renderHook(() => useSetting("theme"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SettingsPortProvider value={port}>{children}</SettingsPortProvider>
      ),
    });

    expect(result.current).toBe("dark");
  });

  it("throws when no provider is mounted", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => renderHook(() => useSetting("theme"))).toThrow(SettingsPortMissing);

    consoleError.mockRestore();
  });
});

describe("useUpdateSetting", () => {
  it("forwards the change to the app port and returns the new value", () => {
    const { port, updates } = createFakeSettingsPort({ theme: "system" });

    const { result } = renderHook(
      () => ({ setValue: useUpdateSetting(), theme: useSetting("theme") }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <SettingsPortProvider value={port}>{children}</SettingsPortProvider>
        ),
      },
    );

    act(() => {
      result.current.setValue({ key: "theme", value: "dark" });
    });

    expect(updates).toEqual([{ key: "theme", value: "dark" }]);
    expect(port.values.theme).toBe("dark");
  });
});

describe("useSettingsPort", () => {
  type CounterValues = Readonly<{ count: number }>;
  type CounterPort = SettingsPort<CounterValues, UpdateOf<CounterValues>>;

  it("gives a section its own values and updates from the one port the app provides", () => {
    const { port, updates } = createFakePort<CounterValues, UpdateOf<CounterValues>>(
      { count: 1 },
      { count: 2 },
    );

    const { result } = renderHook(() => useSettingsPort<CounterPort>(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SettingsPortProvider value={port}>{children}</SettingsPortProvider>
      ),
    });
    act(() => {
      result.current.setValue({ key: "count", value: 3 });
    });

    expect(updates).toEqual([{ key: "count", value: 3 }]);
    expect(port.values.count).toBe(3);
  });
});
