import React, { useEffect } from "react";
import { Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import {
  mockContact,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { SEND_FLOW_STEP, type SendFlowStep } from "@ledgerhq/live-common/flows/send/types";
import type { StepRegistry } from "@ledgerhq/live-common/flows/wizard/types";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { renderWithReactQuery, screen, withFlagOverrides } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { ModularDrawerWrapper } from "LLM/features/ModularDrawer";
import { SEND_FLOW_CONFIG } from "../constants";
import { SendContactsFirstProvider } from "../context/SendContactsFirstContext";
import { SendFlowOrchestrator } from "../SendFlowOrchestrator";
import { AmountScreen } from "../screens/Amount";
import { CoinControlScreen } from "../screens/CoinControl";
import { ConfirmationScreen } from "../screens/Confirmation";
import { CustomFeesScreen } from "../screens/CustomFees";
import { RecipientScreen } from "../screens/Recipient";
import { SignatureScreen } from "../screens/Signature";

const ethAccount = genAccount("contacts-first-eth", {
  currency: getCryptoCurrencyById("ethereum"),
});

type TestStackParamList = {
  PayHost: undefined;
  [NavigatorName.SendFlow]:
    | {
        params?: { account?: { id: string } };
      }
    | undefined;
  [NavigatorName.SendFunds]:
    | {
        screen: typeof ScreenName.SendCoin;
        params?: { currencyIds?: string[] };
      }
    | undefined;
  [NavigatorName.MyWallet]:
    | {
        screen: typeof ScreenName.MyWalletContactDetail;
        params: { contactId: string };
      }
    | undefined;
};

const Stack = createNativeStackNavigator<TestStackParamList>();

const stepRegistry: StepRegistry<SendFlowStep> = {
  [SEND_FLOW_STEP.RECIPIENT]: RecipientScreen,
  [SEND_FLOW_STEP.RECENT_HISTORY]: () => null,
  [SEND_FLOW_STEP.AMOUNT]: AmountScreen,
  [SEND_FLOW_STEP.CUSTOM_FEES]: CustomFeesScreen,
  [SEND_FLOW_STEP.COIN_CONTROL]: CoinControlScreen,
  [SEND_FLOW_STEP.SIGNATURE]: SignatureScreen,
  [SEND_FLOW_STEP.CONFIRMATION]: ConfirmationScreen,
};

function SendFundsScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, typeof NavigatorName.SendFunds>) {
  return (
    <Text testID="send-funds-screen">
      {route.params?.screen}:{route.params?.params?.currencyIds?.join(",") ?? ""}
    </Text>
  );
}

function MyWalletScreen({
  route,
}: NativeStackScreenProps<TestStackParamList, typeof NavigatorName.MyWallet>) {
  return (
    <Text testID="my-wallet-contact-detail-screen">
      {route.params?.screen}:{route.params?.params?.contactId ?? ""}
    </Text>
  );
}

function PayHostScreen({ navigation }: NativeStackScreenProps<TestStackParamList, "PayHost">) {
  useEffect(() => {
    navigation.navigate(NavigatorName.SendFlow);
  }, [navigation]);

  return <Text>Pay home</Text>;
}

function SendFlowScreen({
  route,
  navigation,
}: NativeStackScreenProps<TestStackParamList, typeof NavigatorName.SendFlow>) {
  const accountId = route.params?.params?.account?.id;
  if (accountId) {
    return (
      <>
        <Text testID="send-flow-screen">{`send:${accountId}`}</Text>
        <Text accessibilityRole="button" onPress={() => navigation.goBack()}>
          Back
        </Text>
      </>
    );
  }

  return (
    <SendContactsFirstProvider enabled>
      <SendFlowOrchestrator
        initParams={{}}
        onClose={() => {}}
        stepRegistry={stepRegistry}
        flowConfig={SEND_FLOW_CONFIG}
      />
    </SendContactsFirstProvider>
  );
}

function renderContactsFirstSend(contacts: readonly Contact[]) {
  return renderWithReactQuery(
    <>
      <Stack.Navigator
        initialRouteName="PayHost"
        screenOptions={{ headerShown: false, animation: "none" }}
      >
        <Stack.Screen name="PayHost" component={PayHostScreen} />
        <Stack.Screen name={NavigatorName.SendFlow} component={SendFlowScreen} />
        <Stack.Screen name={NavigatorName.SendFunds} component={SendFundsScreen} />
        <Stack.Screen name={NavigatorName.MyWallet} component={MyWalletScreen} />
      </Stack.Navigator>
      <ModularDrawerWrapper />
    </>,
    {
      overrideInitialState: withFlagOverrides(
        {
          llmModularDrawer: {
            enabled: true,
            params: { enableModularization: true, searchDebounceTime: 0 },
          },
          newSendFlow: {
            enabled: true,
            params: { families: ["evm"], excludedCurrencyIds: [] },
          },
        },
        state => ({
          ...state,
          contacts: { contacts: [...contacts] },
          accounts: { active: [{ ...ethAccount, subAccounts: [] }] },
        }),
      ),
    },
  );
}

describe("Send contacts-first", () => {
  it("should open the address sheet then MAD for any saved address count", async () => {
    const oneAddress = mockContactWithAddress({ id: "contact-yana", name: "Yana" });
    const several = mockContactWithMultipleAddresses({
      id: "contact-stephanie",
      name: "Stephanie",
    });
    const { user, store } = renderContactsFirstSend([
      mockMeContact({ name: "Me" }),
      oneAddress,
      several,
    ]);

    expect(await screen.findByText("Contacts")).toBeVisible();
    expect(screen.getByText("Yana")).toBeVisible();
    expect(screen.getByText("Stephanie")).toBeVisible();
    expect(screen.queryByText("Me")).not.toBeOnTheScreen();

    await user.press(screen.getByText("Yana"));

    expect(await screen.findByText("Select Yana's address")).toBeVisible();
    await user.press(
      screen.getByLabelText(`${oneAddress.addresses[0].label}, ${oneAddress.addresses[0].address}`),
    );

    expect(store.getState().modularDrawer).toMatchObject({
      isOpen: true,
      flow: "send",
      source: "Pay",
      preselectedCurrencies: [oneAddress.addresses[0].currencyId],
    });
    expect(
      screen.queryByText(`${ScreenName.SendCoin}:${oneAddress.addresses[0].currencyId}`),
    ).not.toBeOnTheScreen();
    expect(screen.getByText("Yana")).toBeVisible();
    expect(screen.queryByText("Pay home")).not.toBeOnTheScreen();
  });

  it("should pick one address when the contact has several", async () => {
    const contact = mockContactWithMultipleAddresses({
      id: "contact-stephanie",
      name: "Stephanie",
    });
    const address = contact.addresses[1];
    const { user, store } = renderContactsFirstSend([contact]);

    await user.press(await screen.findByText("Stephanie"));

    expect(await screen.findByText("Select Stephanie's address")).toBeVisible();
    await user.press(screen.getByLabelText(`${address.label}, ${address.address}`));

    expect(store.getState().modularDrawer).toMatchObject({
      isOpen: true,
      flow: "send",
      preselectedCurrencies: [address.currencyId],
    });
    expect(
      screen.queryByText(`${ScreenName.SendCoin}:${address.currencyId}`),
    ).not.toBeOnTheScreen();
  });

  it("should hide contacts that have no address", async () => {
    const withAddress = mockContactWithAddress({ id: "contact-yana", name: "Yana" });
    const withoutAddress = mockContact({ id: "contact-rosa", name: "Rosa" });
    renderContactsFirstSend([withAddress, withoutAddress]);

    expect(await screen.findByText("Yana")).toBeVisible();
    expect(screen.queryByText("Rosa")).not.toBeOnTheScreen();
  });

  it("should return to the contacts list when going back from amount", async () => {
    const yana = mockContactWithAddress({ id: "contact-yana", name: "Yana" });
    const address = yana.addresses[0];
    const { user } = renderContactsFirstSend([yana]);

    await user.press(await screen.findByText("Yana"));
    await user.press(await screen.findByLabelText(`${address.label}, ${address.address}`));
    await user.press(await screen.findByTestId("asset-item-ETH"));
    await user.press(await screen.findByTestId("account-item"));

    expect(await screen.findByText(`send:${ethAccount.id}`)).toBeVisible();

    await user.press(screen.getByRole("button", { name: "Back" }));

    expect(await screen.findByText("Yana")).toBeVisible();
    expect(screen.queryByText("Pay home")).not.toBeOnTheScreen();
  });
});
