import React, { type ComponentProps } from "react";
import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from "@testing-library/react-native";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { mockAccountStatus } from "@domain/entity-account-status/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  makeReceiveTestStore,
  testOpenExternal,
  receiveTestWrapper,
  testAccountUUID,
  testReceive,
} from "../../__tests__/receiveTestStore";
import { RECEIVE_URLS } from "../../urls";
import { ReceiveAddress } from "./ReceiveAddress";

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
}));

jest.mock("@shared/share-sheet", () => ({
  captureView: jest.fn(async () => "file://card.png"),
}));

jest.mock("@ledgerhq/crypto-icons/native", () => {
  const { Text } = jest.requireActual("react-native");
  return ({ ledgerId }: { ledgerId: string }) => <Text>{`icon:${ledgerId}`}</Text>;
});

jest.mock("@shared/ui-animated-qr-code/native", () => {
  const { Pressable, Text } = jest.requireActual("react-native");
  return {
    AnimatedQrCode: ({
      value,
      animation,
      onPress,
      triggerKey,
      testID,
    }: {
      value: string;
      animation: string;
      onPress?: () => void;
      triggerKey?: number;
      testID?: string;
    }) => (
      <Pressable onPress={onPress} testID={testID ?? `qr-code-${animation}`}>
        <Text>{`qr:${value}`}</Text>
        <Text>{`${animation}:${triggerKey ?? 0}`}</Text>
      </Pressable>
    ),
  };
});

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

const VerifyAddressExecutor = () => {
  const { Text } = jest.requireActual("react-native");
  return <Text testID="verify-executor">verifying</Text>;
};

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

    expect(screen.getByTestId("receive-address-skeleton")).toBeTruthy();
    expect(screen.getByTestId("qr-code-loading")).toBeTruthy();
    expect(await screen.findByTestId("receive-address-summary")).toBeTruthy();
    expect(screen.getByText(`qr:${mockAccountReceive().address}`)).toBeTruthy();
  });

  it("offers Retry when the address cannot be read, then shows it", async () => {
    const receive = jest
      .fn()
      .mockRejectedValueOnce(new Error("sync failed"))
      .mockResolvedValue(testReceive);
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    fireEvent.press(await screen.findByTestId("receive-address-retry"));

    expect(await screen.findByTestId("receive-address-summary")).toBeTruthy();
    expect(screen.queryByTestId("receive-address-error")).toBeNull();
    expect(receive).toHaveBeenCalledTimes(2);
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

  it("copies the address, and shares it with the image of its card", async () => {
    const onCopyAddress = jest.fn(async () => true);
    const onShareAddress = jest.fn();
    renderScreen(jest.fn(), makeReceiveTestStore(), { onCopyAddress, onShareAddress });

    await screen.findByTestId("receive-address-summary");
    fireEvent.press(screen.getByTestId("receive-address-share"));
    fireEvent.press(screen.getByTestId("receive-address-copy"));

    await waitFor(() =>
      expect(onShareAddress).toHaveBeenCalledWith(testReceive.address, "file://card.png"),
    );
    expect(onCopyAddress).toHaveBeenCalledWith(testReceive.address);
    expect(await screen.findByText("Copied")).toBeTruthy();
  });

  it("copies from a press on the QR code, and replays its animation from the Copy button", async () => {
    const onCopyAddress = jest.fn(async () => true);
    renderScreen(jest.fn(), makeReceiveTestStore(), { onCopyAddress });

    fireEvent.press(await screen.findByTestId("receive-address-qr-code"));
    expect(onCopyAddress).toHaveBeenCalledWith(testReceive.address);
    expect(screen.getByText("ripple:0")).toBeTruthy();

    fireEvent.press(screen.getByTestId("receive-address-copy"));
    expect(await screen.findByText("ripple:1")).toBeTruthy();
    expect(onCopyAddress).toHaveBeenCalledTimes(2);
  });

  it("points at Verify, hiding the rest from screen readers, until the hint is dismissed, then verifies", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), { VerifyAddressExecutor });

    expect(await screen.findByTestId("receive-address-verify-hint")).toBeTruthy();
    expect(screen.queryByTestId("receive-address-close")).toBeNull();
    fireEvent.press(screen.getByText("Got it"));
    expect(screen.queryByTestId("receive-address-verify-hint")).toBeNull();
    expect(screen.getByTestId("receive-address-close")).toBeTruthy();

    fireEvent.press(screen.getByTestId("receive-address-verify"));
    expect(screen.getByTestId("verify-executor")).toBeTruthy();
  });

  it("disables Verify for an address the device cannot show", async () => {
    const receive = jest.fn(async () => mockAccountReceive({ verification: undefined }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }), { VerifyAddressExecutor });

    expect((await screen.findByTestId("receive-address-verify")).props.disabled).toBe(true);
    expect(screen.queryByTestId("receive-address-verify-hint")).toBeNull();
  });

  it("puts the title and the address in the card Share captures", async () => {
    renderScreen();

    const card = await screen.findByTestId("receive-address-card");
    expect(within(card).getByTestId("receive-address-summary")).toBeTruthy();
    expect(within(card).getByText("Receive ETH")).toBeTruthy();
  });

  it("shows the family's notices and links them to their support article", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      getFamilyConfig: () => ({ notices: ["tronInactiveAccount"] }),
    });
    const user = userEvent.setup();

    expect(await screen.findByTestId("receive-address-notice-tronInactiveAccount")).toBeTruthy();
    await user.press(screen.getByText("Learn more"));
    expect(testOpenExternal).toHaveBeenCalledWith(RECEIVE_URLS.tronInactiveAccount);
  });

  it("shows a service incident in a bottom sheet over the screen, with its links, until Continue", async () => {
    renderScreen(jest.fn(), makeReceiveTestStore(), {
      serviceIncidents: [
        {
          title: "Ethereum degraded",
          description: [
            { text: "Investigating. See " },
            { text: "this article", url: "https://support.ledger.com/article" },
          ],
        },
      ],
    });
    const user = userEvent.setup();

    expect(await screen.findByText("Ethereum degraded")).toBeTruthy();
    await user.press(screen.getByText("this article"));
    expect(testOpenExternal).toHaveBeenCalledWith("https://support.ledger.com/article");

    await user.press(screen.getByText("Continue"));
    expect(screen.queryByTestId("receive-address-service-status")).toBeNull();
  });

  it("opens the help in a bottom sheet, each question opening its article, until closed", async () => {
    renderScreen();
    const user = userEvent.setup();

    await user.press(await screen.findByText("Need support? Get help"));
    expect(screen.getByTestId("receive-address-help-panel")).toBeTruthy();

    await user.press(screen.getByText("How to receive from exchanges?"));
    expect(testOpenExternal).toHaveBeenCalledWith(RECEIVE_URLS.receiveFromExchange);

    await user.press(screen.getByTestId("receive-address-help-sheet-dismiss"));
    expect(screen.queryByTestId("receive-address-help-panel")).toBeNull();
  });

  it("shows the help card under an error too", async () => {
    const receive = jest.fn(async () => {
      throw new Error("offline");
    });
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    expect(await screen.findByTestId("receive-address-error")).toBeTruthy();
    expect(screen.getByTestId("receive-address-help-card")).toBeTruthy();
  });

  it("opens the memo bottom sheet from its card", async () => {
    const receive = jest.fn(async () => mockAccountReceive({ memo: { type: "tag" } }));
    renderScreen(jest.fn(), makeReceiveTestStore({ receive }));

    fireEvent.press(await screen.findByTestId("receive-address-memo-card"));
    expect(screen.getByTestId("receive-address-memo-panel")).toBeTruthy();

    fireEvent.press(screen.getByText("Got it"));
    expect(screen.queryByTestId("receive-address-memo-panel")).toBeNull();
  });

  it("asks to onboard the account in place of the address, then opens the app's flow", async () => {
    const onResolveGate = jest.fn();
    renderScreen(
      jest.fn(),
      makeReceiveTestStore({
        accountStatus: async () => mockAccountStatus({ gate: { type: "onboarding" } }),
      }),
      { onResolveGate },
    );

    expect(await screen.findByTestId("receive-address-gate-onboarding")).toBeTruthy();
    expect(screen.queryByTestId("receive-address-skeleton")).toBeNull();

    await userEvent.setup().press(screen.getByText("Onboard account"));
    expect(onResolveGate).toHaveBeenCalledTimes(1);
  });
});
