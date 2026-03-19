import React from "react";
import { render, screen } from "tests/testSetup";
import AppInstallItem, { ItemState } from "./AppInstallItem";

function expectDeterminateProgressSvg(container: HTMLElement) {
  expect(container.querySelectorAll("svg circle")).toHaveLength(2);
}

describe("AppInstallItem", () => {
  const baseProps = {
    appName: "Ethereum",
    productName: "Nano X",
    i: 0,
  };

  it("renders idle state with step index", () => {
    render(
      <AppInstallItem {...baseProps} state={ItemState.Idle} progress={0} />,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Ethereum app")).toBeInTheDocument();
  });

  it("renders installed state with check affordance", () => {
    const { container } = render(
      <AppInstallItem {...baseProps} state={ItemState.Installed} progress={0} />,
    );
    expect(screen.getByText("Ethereum app")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders skipped state with helper copy", () => {
    render(
      <AppInstallItem {...baseProps} state={ItemState.Skipped} progress={0} />,
    );
    expect(screen.getByText("Ethereum app")).toBeInTheDocument();
    expect(
      screen.getByText("Not yet available for Nano X"),
    ).toBeInTheDocument();
  });

  it("renders infinite loader when active and progress is 0", () => {
    const { container } = render(
      <AppInstallItem {...baseProps} state={ItemState.Active} progress={0} />,
    );
    expect(
      screen.getByTestId("app-install-item-infinite-loader"),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("svg circle")).toHaveLength(0);
  });

  it("renders infinite loader when active and progress is 1", () => {
    render(
      <AppInstallItem {...baseProps} state={ItemState.Active} progress={1} />,
    );
    expect(
      screen.getByTestId("app-install-item-infinite-loader"),
    ).toBeInTheDocument();
  });

  it("renders determinate progress loader when active and progress is between 0 and 1", () => {
    const { container } = render(
      <AppInstallItem
        {...baseProps}
        state={ItemState.Active}
        progress={0.42}
      />,
    );
    expectDeterminateProgressSvg(container);
    expect(
      screen.queryByTestId("app-install-item-infinite-loader"),
    ).not.toBeInTheDocument();
  });
});
