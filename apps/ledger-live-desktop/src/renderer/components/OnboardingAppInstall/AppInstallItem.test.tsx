import React from "react";
import { render, screen } from "tests/testSetup";
import AppInstallItem, { ItemState } from "./AppInstallItem";

describe("AppInstallItem", () => {
  const baseProps = {
    appName: "Ethereum",
    productName: "Nano X",
    i: 0,
  };

  it("idle: step index, app label, no loaders", () => {
    render(<AppInstallItem {...baseProps} state={ItemState.Idle} progress={0} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Ethereum app")).toBeInTheDocument();
    expect(screen.queryByTestId("app-install-item-infinite-loader")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-install-item-progress-loader")).not.toBeInTheDocument();
  });

  it("installed: check icon and app label, no loaders", () => {
    const { container } = render(
      <AppInstallItem {...baseProps} state={ItemState.Installed} progress={0} />,
    );
    expect(screen.getByText("Ethereum app")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByTestId("app-install-item-infinite-loader")).not.toBeInTheDocument();
    expect(screen.queryByTestId("app-install-item-progress-loader")).not.toBeInTheDocument();
  });

  it("skipped: app label and product-specific skipped copy", () => {
    render(<AppInstallItem {...baseProps} state={ItemState.Skipped} progress={0} />);
    expect(screen.getByText("Ethereum app")).toBeInTheDocument();
    expect(screen.getByText("Not yet available for Nano X")).toBeInTheDocument();
    expect(screen.queryByTestId("app-install-item-infinite-loader")).not.toBeInTheDocument();
  });

  it.each([
    [0, "at start"],
    [1, "at end"],
  ])("active with progress %s (%s): infinite loader only", (progress, _phase) => {
    render(<AppInstallItem {...baseProps} state={ItemState.Active} progress={progress} />);
    expect(screen.getByTestId("app-install-item-infinite-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("app-install-item-progress-loader")).not.toBeInTheDocument();
  });

  it("active with strictly between (0,1): determinate progress wrapper, no infinite loader", () => {
    render(<AppInstallItem {...baseProps} state={ItemState.Active} progress={0.42} />);
    expect(screen.getByTestId("app-install-item-progress-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("app-install-item-infinite-loader")).not.toBeInTheDocument();
  });

  it("active with tiny positive progress: determinate (not treated as zero)", () => {
    render(
      <AppInstallItem {...baseProps} state={ItemState.Active} progress={Number.MIN_VALUE} />,
    );
    expect(screen.getByTestId("app-install-item-progress-loader")).toBeInTheDocument();
    expect(screen.queryByTestId("app-install-item-infinite-loader")).not.toBeInTheDocument();
  });
});
