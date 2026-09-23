import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { i18nWrapper, REQUEST_RESOURCES } from "../../../__tests__/i18nWrapper";
import { VerifyAddress } from "../VerifyAddress";
import type { VerifyAddressProps } from "../../../types";

function renderVerifyAddress(overrides: Partial<VerifyAddressProps> = {}) {
  const props: VerifyAddressProps = {
    phase: "intro",
    page: "Pay",
    onVerify: jest.fn(),
    onGotIt: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  return {
    props,
    ...render(<VerifyAddress {...props} />, { wrapper: i18nWrapper(REQUEST_RESOURCES) }),
  };
}

describe("VerifyAddress (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing while hidden", () => {
    renderVerifyAddress({ phase: "hidden" });

    expect(screen.queryByTestId("pay-card-verify-address-intro")).toBeNull();
    expect(screen.queryByTestId("pay-card-verify-address-success")).toBeNull();
  });

  it("tracks and starts the device intent from the intro CTA", async () => {
    const user = userEvent.setup();
    const { props } = renderVerifyAddress();

    expect(screen.getByTestId("pay-card-verify-address-intro")).toBeVisible();

    await user.click(screen.getByTestId("pay-card-verify-address-verify-cta"));

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "verify",
      buttonLocation: "verify address",
      page: "Pay",
      flow: "request",
    });
    expect(props.onVerify).toHaveBeenCalledTimes(1);
  });

  it("renders the next steps and closes from the success CTA", async () => {
    const user = userEvent.setup();
    const { props } = renderVerifyAddress({ phase: "success" });

    expect(screen.getByTestId("pay-card-verify-address-success")).toBeVisible();

    await user.click(screen.getByTestId("pay-card-verify-address-got-it-cta"));

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "got it",
      buttonLocation: "verify address",
      page: "Pay",
      flow: "request",
    });
    expect(props.onGotIt).toHaveBeenCalledTimes(1);
  });
});
