import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { receiveTestWrapper, testAccountUUID } from "../../__tests__/receiveTestStore";
import { ReceiveAddress } from "./ReceiveAddress";

describe("ReceiveAddress (Native)", () => {
  it("lays the zones out in screen order", () => {
    render(
      <ReceiveAddress
        accountUUID={testAccountUUID}
        assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
        onClose={jest.fn()}
      />,
      { wrapper: receiveTestWrapper() },
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
