import React from "react";
import { render, screen } from "@testing-library/react-native";
import { computeAccountUUID } from "@domain/entity-account-descriptor";
import { mockAddressAccountDescriptor } from "@domain/entity-account-descriptor/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ReceiveAddress } from "./ReceiveAddress";

describe("ReceiveAddress (Native)", () => {
  it("renders the screen", () => {
    render(
      <ReceiveAddress
        accountUUID={computeAccountUUID(mockAddressAccountDescriptor())}
        assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
        onClose={jest.fn()}
      />,
      { wrapper: I18nTestProvider },
    );

    expect(screen.getByTestId("receive-address")).toBeTruthy();
  });
});
