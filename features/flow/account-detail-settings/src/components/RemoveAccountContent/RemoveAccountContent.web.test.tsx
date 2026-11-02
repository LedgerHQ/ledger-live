import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { RemoveAccountContent } from "./RemoveAccountContent";

describe("RemoveAccountContent (Web)", () => {
  it("asks for confirmation and calls the matching handler", async () => {
    const user = userEvent.setup();
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    render(<RemoveAccountContent onConfirm={onConfirm} onCancel={onCancel} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByText("Remove account?")).toBeVisible();
    expect(screen.getByText(/will no longer be visible in your portfolio/)).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Yes, remove" }));
    await user.click(screen.getByRole("button", { name: "Keep" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
