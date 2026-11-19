import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  makeReceiveTestStore,
  receiveTestWrapper,
  testAccountUUID,
} from "../../__tests__/receiveTestStore";
import { ReceiveAddress } from "./ReceiveAddress";

jest.mock("@ledgerhq/crypto-icons/native", () => {
  const { Text } = jest.requireActual("react-native");
  return ({ ledgerId }: { ledgerId: string }) => <Text>{`icon:${ledgerId}`}</Text>;
});

jest.mock("@shared/ui-animated-qr-code/native", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    AnimatedQrCode: ({ value, testID }: { value: string; testID?: string }) => (
      <Text testID={testID}>{`qr:${value}`}</Text>
    ),
  };
});

const renderScreen = (onClose = jest.fn(), store = makeReceiveTestStore()) =>
  render(
    <ReceiveAddress
      accountUUID={testAccountUUID}
      assetId={CryptoOrTokenCurrencyIdSchema.parse("ethereum")}
      onClose={onClose}
    />,
    { wrapper: receiveTestWrapper(store) },
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

  it("shows the animated QR code of the address once it is read", async () => {
    renderScreen();

    expect(screen.getByTestId("receive-address-zone-summary")).toBeTruthy();
    expect(await screen.findByTestId("receive-address-summary")).toBeTruthy();
    expect(screen.getByText(`qr:${mockAccountReceive().address}`)).toBeTruthy();
  });

  it("shows the address with its first and last characters apart", async () => {
    renderScreen();

    expect(await screen.findByText("0x71C765")).toBeTruthy();
    expect(screen.getByText("f6d8976F")).toBeTruthy();
  });

  it("lets a Zcash account pick its private address, then go back to the choice", async () => {
    const shielded = "u1shieldedaddressexample0000000000000000000000000000";
    const receive = jest.fn(async () => mockAccountReceive({ shielded: { address: shielded } }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    fireEvent.press(await screen.findByTestId("receive-address-option-shielded"));

    expect(screen.getByText("Private address")).toBeTruthy();
    expect(screen.getByText(shielded.slice(0, 8))).toBeTruthy();
    fireEvent.press(screen.getByTestId("receive-address-close"));
    expect(screen.getByTestId("receive-address-options")).toBeTruthy();
  });

  it("lays the zones out in screen order", async () => {
    renderScreen();
    await screen.findByTestId("receive-address-summary");

    expect(screen.getAllByTestId(/^receive-address-zone-/).map(zone => zone.props.testID)).toEqual([
      "receive-address-zone-actions",
      "receive-address-zone-notices",
      "receive-address-zone-extras",
    ]);
  });
});
