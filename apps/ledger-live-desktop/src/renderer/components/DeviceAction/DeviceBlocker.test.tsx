import React from "react";
import { render, screen } from "@testing-library/react";
import { DeviceBlocker, useDeviceBlocked } from "./DeviceBlocker";

function BlockedReader() {
  const blocked = useDeviceBlocked();
  return <span data-testid="reader">{blocked ? "blocked" : "unblocked"}</span>;
}

function readerState() {
  return screen.getByTestId("reader").textContent;
}

describe("useDeviceBlocked", () => {
  it("is blocked while a DeviceBlocker is mounted and unblocked after it unmounts", () => {
    const { rerender } = render(
      <>
        <BlockedReader />
        <DeviceBlocker />
      </>,
    );
    expect(readerState()).toBe("blocked");

    rerender(<BlockedReader />);
    expect(readerState()).toBe("unblocked");
  });

  it("ends unblocked when mounted in the same commit that unmounts the last DeviceBlocker", () => {
    const { rerender } = render(<DeviceBlocker key="blocker" />);

    rerender(<BlockedReader key="reader" />);

    expect(readerState()).toBe("unblocked");
  });
});
