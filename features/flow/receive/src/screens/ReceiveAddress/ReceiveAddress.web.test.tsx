import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { receiveTestWrapper, testAccountUUID } from "../../__tests__/receiveTestStore";
import { ReceiveAddress } from "./ReceiveAddress";

const renderScreen = (onClose = jest.fn()) =>
  render(
    <ReceiveAddress
      accountUUID={testAccountUUID}
      assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
      onClose={onClose}
    />,
    { wrapper: receiveTestWrapper() },
  );

describe("ReceiveAddress (Web)", () => {
  it("opens as a dialog that closes from its header", async () => {
    const onClose = jest.fn();
    renderScreen(onClose);

    expect(screen.getByTestId("receive-address")).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lays the zones out in screen order", () => {
    renderScreen();

    expect(
      screen.getAllByTestId(/^receive-address-zone-/).map(zone => zone.dataset.testid),
    ).toEqual([
      "receive-address-zone-header",
      "receive-address-zone-summary",
      "receive-address-zone-address",
      "receive-address-zone-actions",
      "receive-address-zone-notices",
      "receive-address-zone-extras",
    ]);
  });
});
