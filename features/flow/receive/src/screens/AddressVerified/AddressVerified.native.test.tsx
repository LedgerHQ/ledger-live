import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AddressVerified } from "./AddressVerified";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("AddressVerified (Native)", () => {
  it("should confirm the address and finish on Done", async () => {
    const onDone = jest.fn();
    render(<AddressVerified onDone={onDone} />, { wrapper: I18nTestProvider });

    expect(screen.getByText("receiveAddress.addressVerified.title")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressVerified.description")).toBeVisible();
    await userEvent.setup().press(screen.getByTestId("receive-address-verified-done"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
