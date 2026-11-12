import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { i18nWrapper, RECEIVE_RESOURCES } from "../../../__tests__/i18nWrapper";
import { receiveAddressProps } from "../../../__tests__/receiveAddressProps";
import { ReceiveAddress } from "../ReceiveAddress";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const wrapper = i18nWrapper(RECEIVE_RESOURCES);

describe("ReceiveAddress (Native)", () => {
  afterEach(cleanup);

  it("shows skeletons and inert actions while the address is read, then the address", async () => {
    const user = userEvent.setup();
    const loading = receiveAddressProps({ address: "", isLoadingAddress: true });
    const { rerender } = render(<ReceiveAddress {...loading} />, { wrapper });

    expect(screen.getByTestId("receive-address-skeleton")).toBeOnTheScreen();
    expect(screen.queryByTestId("receive-address-qr-code")).not.toBeOnTheScreen();
    await user.press(screen.getByTestId("receive-address-copy"));
    await user.press(screen.getByTestId("receive-address-verify"));
    expect(loading.onCopy).not.toHaveBeenCalled();
    expect(loading.onVerify).not.toHaveBeenCalled();

    const ready = receiveAddressProps();
    rerender(<ReceiveAddress {...ready} />);

    expect(screen.queryByTestId("receive-address-skeleton")).not.toBeOnTheScreen();
    expect(screen.getByTestId("receive-address-qr-code")).toBeOnTheScreen();
    await user.press(screen.getByTestId("receive-address-copy"));
    expect(ready.onCopy).toHaveBeenCalledTimes(1);
  });

  it("offers to read the address again when the read failed", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <ReceiveAddress
        {...receiveAddressProps({ address: "", blockedReason: "readFailed", onRetry })}
      />,
      { wrapper },
    );

    expect(screen.getByText("Your address couldn't be loaded")).toBeOnTheScreen();
    await user.press(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("offers the family activation, not the legacy hand-over, for a token to activate", async () => {
    const user = userEvent.setup();
    const onActivateAsset = jest.fn();
    render(
      <ReceiveAddress
        {...receiveAddressProps({
          address: "",
          asset: { name: "USD Coin", ticker: "USDC" },
          network: "Stellar",
          family: {
            isSupported: true,
            notices: [],
            verification: "unavailable",
            activationKind: "trustline",
          },
          blockedReason: "assetActivationRequired",
          onActivateAsset,
          onUseLegacyFlow: jest.fn(),
        })}
      />,
      { wrapper },
    );

    expect(screen.getByText("Activate USDC on Stellar")).toBeOnTheScreen();
    expect(screen.queryByText("Continue")).not.toBeOnTheScreen();
    await user.press(screen.getByText("Activate"));
    expect(onActivateAsset).toHaveBeenCalledTimes(1);
  });

  it("offers to read again while the activation is not confirmed yet", async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    render(
      <ReceiveAddress
        {...receiveAddressProps({ address: "", blockedReason: "assetActivationPending", onRetry })}
      />,
      { wrapper },
    );

    expect(screen.getByText("Activation in progress")).toBeOnTheScreen();
    await user.press(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
