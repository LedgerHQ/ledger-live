import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ReceiveAddress } from "./ReceiveAddress";

const renderScreen = (onClose = jest.fn()) =>
  render(
    <ReceiveAddress
      accountUUID={computeAccountUUID(mockAddressAccountDescriptor())}
      assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
      onClose={onClose}
    />,
    { wrapper: I18nTestProvider },
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
