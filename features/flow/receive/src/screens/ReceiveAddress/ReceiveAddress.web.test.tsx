import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    await waitFor(() => expect(screen.queryByTestId("receive-address-skeleton")).toBeNull());
    expect(screen.getByTestId("receive-address-zone-summary")).toBeVisible();
  });

  it("offers Retry when the address cannot be read, then shows it", async () => {
    const receive = jest
      .fn()
      .mockRejectedValueOnce(new Error("sync failed"))
      .mockResolvedValue(testReceive);
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    await userEvent.setup().click(await screen.findByTestId("receive-address-retry"));

    await waitFor(() => expect(screen.getByTestId("receive-address-zone-summary")).toBeVisible());
    expect(screen.queryByTestId("receive-address-error")).toBeNull();
    expect(receive).toHaveBeenCalledTimes(2);
  });

  it("lays the zones out in screen order", async () => {
    renderScreen();
    await waitFor(() => expect(screen.queryByTestId("receive-address-skeleton")).toBeNull());

    expect(
      screen.getAllByTestId(/^receive-address-zone-/).map(zone => zone.dataset.testid),
    ).toEqual([
      "receive-address-zone-summary",
      "receive-address-zone-address",
      "receive-address-zone-actions",
      "receive-address-zone-notices",
      "receive-address-zone-extras",
    ]);
  });
});
