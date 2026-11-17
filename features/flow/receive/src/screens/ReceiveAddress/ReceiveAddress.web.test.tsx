import React, { type ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  makeReceiveTestStore,
  receiveTestWrapper,
  testAccountUUID,
  testReceive,
} from "../../__tests__/receiveTestStore";
import type { UseVerifyAddressExecutorViewModelParams } from "../../hooks/useVerifyAddressExecutorViewModel";
import { ReceiveAddress } from "./ReceiveAddress";

const renderScreen = (
  onClose = jest.fn(),
  store = makeReceiveTestStore(),
  ports: Partial<ComponentProps<typeof ReceiveAddress>> = {},
) =>
  render(
    <ReceiveAddress
      accountUUID={testAccountUUID}
      assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
      onClose={onClose}
      {...ports}
    />,
    { wrapper: receiveTestWrapper(store) },
  );

const VerifyAddressExecutor = ({ selection }: UseVerifyAddressExecutorViewModelParams) => (
  <div data-testid="verify-executor">{selection.verification.path}</div>
);

describe("ReceiveAddress (Web)", () => {
  it("opens as a dialog that closes from its header", async () => {
    const onClose = jest.fn();
    renderScreen(onClose);

    expect(screen.getByTestId("receive-address")).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("names the asset and its network in the header", () => {
    renderScreen();

    expect(screen.getByText("Receive ETH")).toBeVisible();
    expect(screen.getByText("Ethereum network")).toBeVisible();
  });

  it("holds the place of the address with skeletons until it is read", async () => {
    renderScreen();

    expect(screen.getByTestId("receive-address-skeleton")).toBeVisible();
    expect(await screen.findByTestId("receive-address-summary")).toBeVisible();
    expect(screen.queryByTestId("receive-address-skeleton")).toBeNull();
  });

  it("shows the address with its first and last characters apart", async () => {
    renderScreen();

    const text = await screen.findByTestId("receive-address-text");
    expect(text).toHaveTextContent(testReceive.address);
    expect(screen.getByText("0x71C765")).toBeVisible();
    expect(screen.getByText("f6d8976F")).toBeVisible();
  });

  it("lets a Zcash account pick its private address, then go back to the choice", async () => {
    const shielded = "u1shieldedaddressexample0000000000000000000000000000";
    const receive = jest.fn(async () => mockAccountReceive({ shielded: { address: shielded } }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));
    const user = userEvent.setup();

    await user.click(await screen.findByTestId("receive-address-option-shielded"));

    expect(screen.getByText("Private address")).toBeVisible();
    expect(screen.getByTestId("receive-address-text")).toHaveTextContent(shielded);
    await user.click(screen.getByRole("button", { name: "Go back" }));
    expect(screen.getByTestId("receive-address-options")).toBeVisible();
  });

  it("offers Retry when the address cannot be read, then shows it", async () => {
    const receive = jest
      .fn()
      .mockRejectedValueOnce(new Error("sync failed"))
      .mockResolvedValue(testReceive);
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    await userEvent.setup().click(await screen.findByTestId("receive-address-retry"));

    expect(await screen.findByTestId("receive-address-summary")).toBeVisible();
    expect(screen.queryByTestId("receive-address-error")).toBeNull();
    expect(receive).toHaveBeenCalledTimes(2);
  });

  it("copies the address from the Copy tile", async () => {
    const onCopyAddress = jest.fn(async () => true);
    renderScreen(jest.fn(), makeReceiveTestStore(), { onCopyAddress });

    await userEvent.setup().click(await screen.findByTestId("receive-address-copy"));

    expect(onCopyAddress).toHaveBeenCalledWith(testReceive.address);
    expect(screen.getByTestId("receive-address-copy")).toHaveTextContent("Copied");
  });

  it("points at Verify until the hint is dismissed, then verifies on the device", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), { VerifyAddressExecutor });
    const user = userEvent.setup();

    expect(await screen.findByTestId("receive-address-verify-hint")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByTestId("receive-address-verify-hint")).toBeNull();

    await user.click(screen.getByTestId("receive-address-verify"));
    expect(screen.getByTestId("verify-executor")).toHaveTextContent(testReceive.verification!.path);
  });

  it("disables Verify for an address the device cannot show", async () => {
    const receive = jest.fn(async () => mockAccountReceive({ verification: undefined }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }), { VerifyAddressExecutor });

    expect(await screen.findByTestId("receive-address-verify")).toBeDisabled();
    expect(screen.queryByTestId("receive-address-verify-hint")).toBeNull();
  });

  it("lays the zones out in screen order", async () => {
    renderScreen();
    await screen.findByTestId("receive-address-summary");

    expect(
      screen.getAllByTestId(/^receive-address-zone-/).map(zone => zone.dataset.testid),
    ).toEqual(["receive-address-zone-notices", "receive-address-zone-extras"]);
  });
});
