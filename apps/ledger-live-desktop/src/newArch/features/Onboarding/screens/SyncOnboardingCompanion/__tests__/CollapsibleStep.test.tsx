/**
 * @jest-environment jsdom
 */
import React, { ComponentProps } from "react";
import { render, screen } from "tests/testSetup";
import { Text } from "@ledgerhq/react-ui/index";
import CollapsibleStep from "../components/CollapsibleStep";

const getMockProps = (props?: Partial<ComponentProps<typeof CollapsibleStep>>) => ({
  isCollapsed: false,
  children: <Text data-testid="mock-child">MockChildText</Text>,
  title: "MockTitle",
  isComplete: false,
  hideTitle: false,
  background: undefined,
  doneTitle: "MockDoneTitle",
  ...props,
});

describe("CollapsibleStep", () => {
  it("should show step open when not collapsed", () => {
    render(<CollapsibleStep {...getMockProps()} />);

    const child = screen.getByTestId("mock-child");

    expect(child).toBeVisible();
    expect(child.innerHTML).toEqual("MockChildText");

    const title = screen.getByTestId("collapsible-step-title");
    expect(title).toBeVisible();

    const doneTitle = screen.queryByTestId("collapsible-step-done-title");
    expect(doneTitle).toBeNull();

    const statusIcon = screen.queryByTestId("sync-onboarding-status-icon");
    expect(statusIcon).toBeNull();
  });

  it("should show step closed when collapsed", () => {
    render(<CollapsibleStep {...getMockProps({ isCollapsed: true })} />);

    const child = screen.queryByTestId("mock-child");

    expect(child).toBeNull();

    const title = screen.getByTestId("collapsible-step-title");
    expect(title).toBeVisible();

    const doneTitle = screen.getByTestId("collapsible-step-done-title");
    expect(doneTitle).toBeVisible();

    const statusIcon = screen.queryByTestId("sync-onboarding-status-icon");
    expect(statusIcon).toBeNull();
  });

  it("should hide title", () => {
    render(<CollapsibleStep {...getMockProps({ hideTitle: true })} />);

    const child = screen.getByTestId("mock-child");

    expect(child).toBeVisible();
    expect(child.innerHTML).toEqual("MockChildText");

    const title = screen.queryByTestId("collapsible-step-title");
    expect(title).toBeNull();

    const doneTitle = screen.queryByTestId("collapsible-step-done-title");
    expect(doneTitle).toBeNull();

    const statusIcon = screen.queryByTestId("sync-onboarding-status-icon");
    expect(statusIcon).toBeNull();
  });

  describe("completed status icon", () => {
    it("should show when not collapsed", () => {
      render(<CollapsibleStep {...getMockProps({ isComplete: true })} />);

      const statusIcon = screen.getByTestId("sync-onboarding-status-icon");
      expect(statusIcon).toBeVisible();
    });

    it("should show when collapsed", () => {
      render(<CollapsibleStep {...getMockProps({ isComplete: true, isCollapsed: true })} />);

      const statusIcon = screen.getByTestId("sync-onboarding-status-icon");
      expect(statusIcon).toBeVisible();
    });
  });
});
