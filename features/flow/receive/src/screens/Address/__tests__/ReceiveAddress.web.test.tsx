import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { i18nWrapper, RECEIVE_RESOURCES } from "../../../__tests__/i18nWrapper";
import { receiveAddressProps } from "../../../__tests__/receiveAddressProps";
import { ReceiveAddress } from "../ReceiveAddress";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const wrapper = i18nWrapper(RECEIVE_RESOURCES);

describe("ReceiveAddress (Web)", () => {
  afterEach(cleanup);

  it("shows skeletons and disabled actions while the address is read, then the address", () => {
    const { rerender } = render(
      <ReceiveAddress {...receiveAddressProps({ address: "", isLoadingAddress: true })} />,
      { wrapper },
    );

    expect(screen.getByTestId("receive-address-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("receive-address-qr-code")).not.toBeInTheDocument();
    expect(screen.getByTestId("receive-address-copy")).toBeDisabled();
    expect(screen.getByTestId("receive-address-verify")).toBeDisabled();

    rerender(<ReceiveAddress {...receiveAddressProps()} />);

    expect(screen.queryByTestId("receive-address-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTestId("receive-address-qr-code")).toBeInTheDocument();
    expect(screen.getByTestId("receive-address-copy")).toBeEnabled();
  });

  it.each([
    ["transparent", false],
    ["shielded", true],
  ] as const)(
    "shows the Tag/Memo card on the %s address only where a memo rides to it",
    async (optionId, showsMemoCard) => {
      render(
        <ReceiveAddress
          {...receiveAddressProps({
            family: {
              isSupported: true,
              notices: [],
              verification: "device",
              addressOptions: [
                { id: "transparent", address: "t1transparent", verification: "device" },
                {
                  id: "shielded",
                  address: "u1shielded",
                  verification: "unavailable",
                  memoType: "text",
                },
              ],
            },
          })}
        />,
        { wrapper },
      );

      await userEvent.click(screen.getByTestId(`receive-address-option-${optionId}`));

      expect(!!screen.queryByTestId("receive-address-memo-tag")).toBe(showsMemoCard);
    },
  );

  it("offers to read the address again when the read failed", async () => {
    const onRetry = jest.fn();
    render(
      <ReceiveAddress
        {...receiveAddressProps({ address: "", blockedReason: "readFailed", onRetry })}
      />,
      { wrapper },
    );

    expect(screen.getByText("Your address couldn't be loaded")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("offers the family activation, not the legacy hand-over, for a token to activate", async () => {
    const onActivateAsset = jest.fn();
    const onUseLegacyFlow = jest.fn();
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
          onUseLegacyFlow,
        })}
      />,
      { wrapper },
    );

    expect(screen.getByText("Activate USDC on Stellar")).toBeInTheDocument();
    expect(
      screen.getByText("Your account must add a trustline for this asset before receiving it."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Activate" }));
    expect(onActivateAsset).toHaveBeenCalledTimes(1);
  });

  it("keeps the legacy hand-over when the family can't activate from this screen", () => {
    render(
      <ReceiveAddress
        {...receiveAddressProps({
          address: "",
          blockedReason: "assetActivationRequired",
          onUseLegacyFlow: jest.fn(),
        })}
      />,
      { wrapper },
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activate" })).not.toBeInTheDocument();
  });

  it("offers to read again while the activation is not confirmed yet", async () => {
    const onRetry = jest.fn();
    render(
      <ReceiveAddress
        {...receiveAddressProps({ address: "", blockedReason: "assetActivationPending", onRetry })}
      />,
      { wrapper },
    );

    expect(screen.getByText("Activation in progress")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
