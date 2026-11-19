import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AddressVerified } from "./AddressVerified";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("AddressVerified (Web)", () => {
  it("should confirm the address and finish on Done", async () => {
    const onDone = jest.fn();
    render(<AddressVerified onDone={onDone} />, { wrapper: I18nTestProvider });

    expect(screen.getByText("receiveAddress.addressVerified.title")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressVerified.description")).toBeVisible();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "receiveAddress.addressVerified.doneCta" }));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
