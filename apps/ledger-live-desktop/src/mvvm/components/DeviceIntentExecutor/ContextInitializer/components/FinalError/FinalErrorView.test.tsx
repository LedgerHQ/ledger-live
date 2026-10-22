import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { FinalErrorView } from "./FinalErrorView";

jest.mock("~/renderer/components/TranslatedError", () => ({
  __esModule: true,
  default: ({ field }: { field: string }) => <span>{`translated-${field}`}</span>,
}));

describe("FinalErrorView", () => {
  const renderView = () => {
    const onContactSupport = jest.fn();
    const onCancel = jest.fn();
    const { user } = render(
      <FinalErrorView
        error={new Error("unexpected")}
        onContactSupport={onContactSupport}
        onCancel={onCancel}
      />,
    );
    return { user, onContactSupport, onCancel };
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
});
