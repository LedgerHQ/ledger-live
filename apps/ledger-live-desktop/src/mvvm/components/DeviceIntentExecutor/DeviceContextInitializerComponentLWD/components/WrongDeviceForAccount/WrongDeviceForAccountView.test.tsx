import React from "react";
import { screen } from "@testing-library/react";
import { render } from "tests/testSetup";
import { WrongDeviceForAccountView } from "./WrongDeviceForAccountView";

describe("WrongDeviceForAccountView", () => {
  const renderView = () => {
    const onCancel = jest.fn();
    const onContactSupport = jest.fn();
    const { user } = render(
      <WrongDeviceForAccountView onCancel={onCancel} onContactSupport={onContactSupport} />,
    );
    return { user, onCancel, onContactSupport };
  };

  it("GIVEN the wrong device view WHEN rendering THEN it shows the wrong recovery phrase copy", () => {
    // GIVEN
    renderView();

    // THEN
    expect(screen.getByText("Wrong Secret Recovery Phrase")).toBeVisible();
  });

  it("GIVEN the wrong device view WHEN clicking Close THEN it calls cancel", async () => {
    // GIVEN
    const { user, onCancel, onContactSupport } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Close" }));

    // THEN
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onContactSupport).not.toHaveBeenCalled();
  });

  it("GIVEN the wrong device view WHEN clicking Contact Ledger support THEN it calls support", async () => {
    // GIVEN
    const { user, onCancel, onContactSupport } = renderView();

    // WHEN
    await user.click(screen.getByRole("button", { name: "Contact Ledger support" }));

    // THEN
    expect(onContactSupport).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });
});
