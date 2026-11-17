import React from "react";
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
import { ReceiveAddress } from "./ReceiveAddress";

const renderScreen = (onClose = jest.fn(), store = makeReceiveTestStore()) =>
  render(
    <ReceiveAddress
      accountUUID={testAccountUUID}
      assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
      onClose={onClose}
    />,
    { wrapper: receiveTestWrapper(store) },
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

  it("lays the zones out in screen order", async () => {
    renderScreen();
    await screen.findByTestId("receive-address-summary");

    expect(
      screen.getAllByTestId(/^receive-address-zone-/).map(zone => zone.dataset.testid),
    ).toEqual([
      "receive-address-zone-actions",
      "receive-address-zone-notices",
      "receive-address-zone-extras",
    ]);
  });
});
