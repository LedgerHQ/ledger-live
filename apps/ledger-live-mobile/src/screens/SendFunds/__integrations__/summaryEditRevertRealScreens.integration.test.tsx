import React from "react";
import { Pressable, Text } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { setEnv } from "@shared/env";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { act, renderWithReactQuery, screen, withFlagOverrides } from "@tests/test-renderer";
import { bridgeSuspenseScreenLayout } from "~/navigation/navigatorConfig";
import type { State } from "~/reducers/types";
import { NavigatorName, ScreenName } from "~/const";
import SendSelectRecipient from "../02-SelectRecipient";
import SendAmountCoin from "../03a-AmountCoin";
import SendSummary from "../04-Summary";
import { component as XrpEditTag } from "~/families/xrp/ScreenEditTag";

const currency = getCryptoCurrencyById("ripple");
const account = genAccount("send-xrp-account", { currency });
const recipientAccount = genAccount("recipient-xrp-account", { currency });
const RECIPIENT = recipientAccount.freshAddress;

const RootStack = createNativeStackNavigator();
const BaseStack = createNativeStackNavigator();
const SendStack = createNativeStackNavigator();

function GoBack({ testID }: { testID: string }) {
  const navigation = useNavigation();
  return (
    <Pressable testID={testID} onPress={() => navigation.goBack()}>
      <Text>back</Text>
    </Pressable>
  );
}

const withGoBack =
  <P extends object>(Component: React.ComponentType<P>, testID: string, probe = false) =>
  (props: P) => (
    <>
      <Component {...props} />
      <GoBack testID={testID} />
      {probe && <StackProbe />}
    </>
  );

function StackProbe() {
  const names = useNavigationState(state => state.routes.map(r => r.name).join(","));
  return <Text testID="stack-probe">{names}</Text>;
}

function SendFundsNested() {
  return (
    <SendStack.Navigator
      screenOptions={{ headerShown: false }}
      screenLayout={bridgeSuspenseScreenLayout}
      initialRouteName={ScreenName.SendSelectRecipient}
    >
      <SendStack.Screen
        name={ScreenName.SendSelectRecipient}
        component={SendSelectRecipient as never}
      />
      <SendStack.Screen
        name={ScreenName.SendAmountCoin}
        component={withGoBack(SendAmountCoin, "amount-go-back") as never}
      />
      <SendStack.Screen
        name={ScreenName.SendSummary}
        component={withGoBack(SendSummary, "summary-go-back", true) as never}
        initialParams={{
          currentNavigation: ScreenName.SendSummary,
          nextNavigation: ScreenName.SendSelectDevice,
        }}
      />
    </SendStack.Navigator>
  );
}

// Mirrors production: the edit screen is a sibling of the send navigator, not one of its steps, so
// editing pushes it onto the base stack and popToScreen returns from above the steps.
function BaseNested() {
  return (
    <BaseStack.Navigator screenOptions={{ headerShown: false }}>
      <BaseStack.Screen name={NavigatorName.SendFunds} component={SendFundsNested} />
      <BaseStack.Screen name={ScreenName.XrpEditTag} component={XrpEditTag as never} />
    </BaseStack.Navigator>
  );
}

function Harness() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name={NavigatorName.Base} component={BaseNested} />
    </RootStack.Navigator>
  );
}

async function flush(): Promise<void> {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1000);
  });
}

function renderFlow() {
  return renderWithReactQuery(<Harness />, {
    overrideInitialState: withFlagOverrides({ llmMemoTag: { enabled: true } }, (state: State) => ({
      ...state,
      accounts: { ...state.accounts, active: [account] },
    })),
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.Base,
          state: {
            index: 0,
            routes: [
              {
                name: NavigatorName.SendFunds,
                state: {
                  index: 0,
                  routes: [
                    {
                      name: ScreenName.SendSelectRecipient,
                      params: { accountId: account.id },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  });
}

describe("send summary edit revert — real screens (integration)", () => {
  beforeAll(() => {
    setEnv("MOCK", "1");
  });

  afterAll(() => {
    setEnv("MOCK", "");
  });

  type User = ReturnType<typeof renderFlow>["user"];

  async function driveToEditedSummary(user: User): Promise<void> {
    await user.paste(await screen.findByTestId("recipient-input"), RECIPIENT);
    await flush();
    await user.paste(await screen.findByTestId("memo-tag-input"), "1234");
    await flush();
    await user.press(await screen.findByTestId("enabled-recipient-continue-button"));

    await user.paste(await screen.findByTestId("amount-input"), "1");
    await flush();
    await user.press(await screen.findByTestId("enabled-amount-continue-button"));

    expect(await screen.findByTestId("summary-memo-tag")).toHaveTextContent("1234");

    await user.press(await screen.findByText("Edit"));
    await user.paste(await screen.findByDisplayValue("1234"), "5678");
    await flush();
    await user.press(await screen.findByText("Validate tag"));
    await flush();

    expect(await screen.findByTestId("summary-memo-tag")).toHaveTextContent("5678");
  }

  it("returns to the summary leaving the steps below it intact", async () => {
    const { user } = renderFlow();

    await driveToEditedSummary(user);

    expect(screen.getByTestId("stack-probe")).toHaveTextContent(
      `${ScreenName.SendSelectRecipient},${ScreenName.SendAmountCoin},${ScreenName.SendSummary}`,
    );
  });

  it("keeps the edited tag when the amount step is revisited", async () => {
    const { user } = renderFlow();

    await driveToEditedSummary(user);

    await user.press(await screen.findByTestId("summary-go-back"));
    await flush();
    await user.press(await screen.findByTestId("enabled-amount-continue-button"));
    await flush();

    expect(await screen.findByTestId("summary-memo-tag")).toHaveTextContent("5678");
  });

  it("keeps the edited tag as far back as the recipient step", async () => {
    const { user } = renderFlow();

    await driveToEditedSummary(user);

    await user.press(await screen.findByTestId("summary-go-back"));
    await flush();
    await user.press(await screen.findByTestId("amount-go-back"));
    await flush();

    await user.press(await screen.findByTestId("enabled-recipient-continue-button"));
    await flush();
    await user.press(await screen.findByTestId("enabled-amount-continue-button"));
    await flush();

    expect(await screen.findByTestId("summary-memo-tag")).toHaveTextContent("5678");
  });
});
