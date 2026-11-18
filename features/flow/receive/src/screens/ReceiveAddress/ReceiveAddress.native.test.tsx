import React from "react";
import { render, screen } from "@testing-library/react-native";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ReceiveAddress } from "./ReceiveAddress";

describe("ReceiveAddress (Native)", () => {
  it("lays the zones out in screen order", () => {
    render(
      <ReceiveAddress
        accountUUID={computeAccountUUID(mockAddressAccountDescriptor())}
        assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
        onClose={jest.fn()}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByTestId("receive-address")).toBeTruthy();
    expect(screen.getAllByTestId(/^receive-address-zone-/).map(zone => zone.props.testID)).toEqual([
      "receive-address-zone-header",
      "receive-address-zone-summary",
      "receive-address-zone-address",
      "receive-address-zone-actions",
      "receive-address-zone-notices",
      "receive-address-zone-extras",
    ]);
  });
});
