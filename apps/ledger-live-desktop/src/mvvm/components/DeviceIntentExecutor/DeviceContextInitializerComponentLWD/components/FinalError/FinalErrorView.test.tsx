import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { FinalErrorView } from "./FinalErrorView";

jest.mock("~/renderer/components/TranslatedError", () => ({
  __esModule: true,
  default: ({ field }: { field: string }) => <span>{`translated-${field}`}</span>,
}));

describe("FinalErrorView", () => {
  const renderView = (isInvalidProvider = false) => {
    const onContactSupport = jest.fn();
    const onCancel = jest.fn();
    const onGoToSettings = jest.fn();
    const { user } = render(
      <FinalErrorView
        error={new Error("unexpected")}
        isInvalidProvider={isInvalidProvider}
        onContactSupport={onContactSupport}
        onCancel={onCancel}
        onGoToSettings={onGoToSettings}
      />,
    );
    return { user, onContactSupport, onCancel, onGoToSettings };
  };

  it("GIVEN the final error view WHEN rendering THEN it shows the translated title and description", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("translated-title")).toBeVisible();
    expect(screen.getByText("translated-description")).toBeVisible();
  });

  it("GIVEN the final error view WHEN clicking Contact Ledger support THEN it calls support", async () => {
    // GIVEN
    const { user, onContactSupport, onCancel } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Contact Ledger support" }));

    // THEN
    expect(onContactSupport).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("GIVEN the final error view WHEN clicking Close THEN it calls cancel", async () => {
    // GIVEN
    const { user, onContactSupport, onCancel } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Close" }));

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onContactSupport).not.toHaveBeenCalled();
  });

  it("GIVEN an invalid provider error WHEN rendering THEN it shows a go to settings CTA instead of contact support", () => {
    // GIVEN
    renderView(true);

    // THEN
    expect(screen.getByRole("button", { name: "Go to settings" })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Contact Ledger support" }),
    ).not.toBeInTheDocument();
  });

  it("GIVEN an invalid provider error WHEN clicking go to settings THEN it calls onGoToSettings", async () => {
    // GIVEN
    const { user, onGoToSettings } = renderView(true);

    // WHEN
    await user.click(screen.getByRole("button", { name: "Go to settings" }));

    // THEN
    expect(onGoToSettings).toHaveBeenCalledTimes(1);
  });
});
