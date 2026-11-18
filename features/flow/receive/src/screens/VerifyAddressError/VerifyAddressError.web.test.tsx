import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { receiveTestWrapper } from "../../__tests__/receiveTestStore";
import { VerifyAddressError } from "./VerifyAddressError";

describe("VerifyAddressError (Web)", () => {
  it("should close the verification when the user closes the error", async () => {
    const onClose = jest.fn();
    render(
      <VerifyAddressError title="App not supported" description="Update it" onClose={onClose} />,
      {
        wrapper: receiveTestWrapper(),
      },
    );

    expect(screen.getByText("App not supported")).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
