import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AddressDisplayed } from "./AddressDisplayed";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

function renderAddressDisplayed() {
  const onGotIt = jest.fn();
  render(<AddressDisplayed onGotIt={onGotIt} />, { wrapper: I18nTestProvider });
  return { onGotIt, user: userEvent.setup() };
}

describe("AddressDisplayed (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the title and the description", () => {
    renderAddressDisplayed();

    expect(screen.getByTestId("receive-address-displayed")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressDisplayed.title")).toBeVisible();
    expect(screen.getByText("receiveAddress.addressDisplayed.description")).toBeVisible();
  });

  it("should call onGotIt when Got it is pressed", async () => {
    const { onGotIt, user } = renderAddressDisplayed();

    await user.press(screen.getByTestId("receive-address-displayed-got-it"));

    expect(onGotIt).toHaveBeenCalledTimes(1);
  });

  it("should track the Got it press", async () => {
    const { user } = renderAddressDisplayed();

    await user.press(screen.getByTestId("receive-address-displayed-got-it"));

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Got it",
      page: "Receive Address Verification",
      flow: "receive",
    });
  });
});
