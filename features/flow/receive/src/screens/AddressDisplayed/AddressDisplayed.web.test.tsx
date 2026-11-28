import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AddressDisplayed } from "./AddressDisplayed";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("AddressDisplayed (Web)", () => {
  it("should ask to compare the pasted address with the device, then go back on Got it", async () => {
    const onGotIt = jest.fn();
    render(<AddressDisplayed onGotIt={onGotIt} />, { wrapper: I18nTestProvider });

    expect(screen.getByText("receiveAddress.addressDisplayed.title")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressDisplayed.description")).toBeVisible();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "receiveAddress.addressDisplayed.gotItCta" }));
    expect(onGotIt).toHaveBeenCalledTimes(1);
  });
});
