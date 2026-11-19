import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { receiveTestWrapper, testAccountUUID } from "../../__tests__/receiveTestStore";
import { ReceiveAddress } from "./ReceiveAddress";

jest.mock("@ledgerhq/crypto-icons/native", () => {
  const { Text } = jest.requireActual("react-native");
  return ({ ledgerId }: { ledgerId: string }) => <Text>{`icon:${ledgerId}`}</Text>;
});

const renderScreen = (onClose = jest.fn()) =>
  render(
    <ReceiveAddress
      accountUUID={testAccountUUID}
      assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
      onClose={onClose}
    />,
    { wrapper: receiveTestWrapper() },
  );

describe("ReceiveAddress (Native)", () => {
  it("names the asset and its network, with the network icon", () => {
    renderScreen();

    expect(screen.getByText("Receive ETH")).toBeTruthy();
    expect(screen.getByText("Ethereum network")).toBeTruthy();
    expect(screen.getByText("icon:ethereum")).toBeTruthy();
  });

  it("closes from the top bar", () => {
    const onClose = jest.fn();
    renderScreen(onClose);

    fireEvent.press(screen.getByTestId("receive-address-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lays the zones out in screen order", () => {
    renderScreen();

    expect(screen.getAllByTestId(/^receive-address-zone-/).map(zone => zone.props.testID)).toEqual([
      "receive-address-zone-summary",
      "receive-address-zone-address",
      "receive-address-zone-actions",
      "receive-address-zone-notices",
      "receive-address-zone-extras",
    ]);
  });
});
