import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AddressMismatch } from "./AddressMismatch";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("AddressMismatch (Web)", () => {
  it("should warn the user off the address and offer Contact Ledger Support and Close", async () => {
    const onContactSupport = jest.fn();
    const onClose = jest.fn();
    render(<AddressMismatch onContactSupport={onContactSupport} onClose={onClose} />, {
      wrapper: I18nTestProvider,
    });
    const user = userEvent.setup();

    expect(screen.getByText("receiveAddress.addressMismatch.title")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressMismatch.description")).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "receiveAddress.addressMismatch.contactSupportCta" }),
    );
    expect(onContactSupport).toHaveBeenCalledTimes(1);
    await user.click(
      screen.getByRole("button", { name: "receiveAddress.addressMismatch.closeCta" }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
