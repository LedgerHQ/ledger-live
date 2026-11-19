import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AddressMismatch } from "./AddressMismatch";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("AddressMismatch (Native)", () => {
  it("should warn the user off the address and offer Contact Ledger Support and Close", async () => {
    const onContactSupport = jest.fn();
    const onClose = jest.fn();
    render(<AddressMismatch onContactSupport={onContactSupport} onClose={onClose} />, {
      wrapper: I18nTestProvider,
    });
    const user = userEvent.setup();

    expect(screen.getByText("receiveAddress.addressMismatch.title")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressMismatch.description")).toBeVisible();
    await user.press(screen.getByTestId("receive-address-mismatch-contact-support"));
    expect(onContactSupport).toHaveBeenCalledTimes(1);
    await user.press(screen.getByTestId("receive-address-mismatch-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
