import React from "react";
import { render, screen } from "@testing-library/react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AddressDisplayed } from "./AddressDisplayed";

describe("AddressDisplayed (Web)", () => {
  it("should render the title and the description, with no action until the user acts on the device", () => {
    render(<AddressDisplayed />, { wrapper: I18nTestProvider });

    expect(screen.getByTestId("receive-address-displayed")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressDisplayed.title")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressDisplayed.description")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
