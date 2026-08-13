import React from "react";
import { render, screen } from "@testing-library/react";
import { OverrideDeviceIntentExecutorHeader } from "./OverrideDeviceIntentExecutorHeader";
import { DeviceIntentExecutorHeaderContext } from "./DeviceIntentExecutorHeaderContext";
import { useDeviceIntentExecutorHeaderOverrideRequests } from "./useDeviceIntentExecutorHeaderOverrideRequests";

describe("OverrideDeviceIntentExecutorHeader", () => {
  it("GIVEN no DeviceIntentExecutorHeaderContext provider WHEN the component renders THEN it renders nothing", () => {
    // GIVEN / WHEN
    render(
      <OverrideDeviceIntentExecutorHeader>
        <span>Custom header</span>
      </OverrideDeviceIntentExecutorHeader>,
    );

    // THEN
    expect(screen.queryByText("Custom header")).toBeNull();
  });

  it("GIVEN no override is mounted WHEN the header slot renders THEN the default header is visible", () => {
    // GIVEN / WHEN
    render(<HeaderOverrideHarness showOverride={false} />);

    // THEN
    expect(screen.getByText("Default header")).toBeVisible();
    expect(screen.queryByText("Custom header")).toBeNull();
  });

  it("GIVEN an override is mounted WHEN the header slot renders THEN the custom header replaces the default header", () => {
    // GIVEN / WHEN
    render(<HeaderOverrideHarness showOverride />);

    // THEN
    expect(screen.getByText("Custom header")).toBeVisible();
    expect(screen.queryByText("Default header")).toBeNull();
  });

  it("GIVEN an override is mounted WHEN it unmounts THEN the default header is restored", () => {
    // GIVEN
    const { rerender } = render(<HeaderOverrideHarness showOverride />);
    expect(screen.getByText("Custom header")).toBeVisible();

    // WHEN
    rerender(<HeaderOverrideHarness showOverride={false} />);

    // THEN
    expect(screen.getByText("Default header")).toBeVisible();
    expect(screen.queryByText("Custom header")).toBeNull();
  });
});

function HeaderOverrideHarness({ showOverride }: Readonly<{ showOverride: boolean }>) {
  const { hasHeaderOverride, headerContextValue } = useDeviceIntentExecutorHeaderOverrideRequests();

  return (
    <DeviceIntentExecutorHeaderContext.Provider value={headerContextValue}>
      {hasHeaderOverride ? null : <span>Default header</span>}
      {showOverride ? (
        <OverrideDeviceIntentExecutorHeader>
          <span>Custom header</span>
        </OverrideDeviceIntentExecutorHeader>
      ) : null}
    </DeviceIntentExecutorHeaderContext.Provider>
  );
}
