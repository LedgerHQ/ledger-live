import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import {
  i18nWrapper,
  RECEIVE_RESOURCES,
  VERIFY_SUCCESS_COPY,
} from "../../../__tests__/i18nWrapper";
import { AddressDisplayed } from "../AddressDisplayed";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

describe("AddressDisplayed (Native)", () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it("tells the user the address is on the device and leaves on Got it", async () => {
    const user = userEvent.setup();
    const onGotIt = jest.fn();
    render(<AddressDisplayed onGotIt={onGotIt} onClose={jest.fn()} />, {
      wrapper: i18nWrapper(RECEIVE_RESOURCES),
    });

    expect(screen.getByText(VERIFY_SUCCESS_COPY.title)).toBeOnTheScreen();
    expect(screen.getByText(VERIFY_SUCCESS_COPY.description)).toBeOnTheScreen();

    await user.press(screen.getByTestId("receive-address-displayed-got-it"));

    expect(onGotIt).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Got it",
      page: "Receive Address Verification",
      flow: "receive",
    });
  });
});
