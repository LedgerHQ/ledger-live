import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction as RippleTransaction } from "@ledgerhq/live-common/families/xrp/types";
import { render, screen } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { useTransactionChangeFromNavigation } from "~/logic/screenTransactionHooks";
import { popToScreen } from "~/helpers/navigationHelpers";
import { syncTransactionToAmountStep } from "../syncTransactionToAmountStep";
import XrpAfterAmountInput from "../AfterAmountInput";
import XrpTagRow from "../SendRowTag";

// Regression coverage for LIVE-35403. The tag isn't in Redux: it rides inside the bridge
// transaction and every step keeps its own copy, so the fix is exercised end-to-end against the
// real navigation topology. Stubs hold their transaction like the real screens (seed once +
// re-sync from nav params) and drive the actual production units: the edit stub calls
// syncTransactionToAmountStep and the amount stub renders the real XrpAfterAmountInput.

const XRP_ACCOUNT = { id: "js:2:ripple:rTest:", currency: { family: "xrp" } } as unknown as Account;

const makeTransaction = (tag: number) =>
  ({ family: "ripple", recipient: "rDestination", tag }) as unknown as RippleTransaction;

type StubParams = { accountId: string; transaction: RippleTransaction };
type StubNavigation = {
  navigate: (name: string, params: StubParams) => void;
  goBack: () => void;
  popTo: (navigator: NavigatorName, params: unknown) => void;
};
type StubScreenProps = { navigation: StubNavigation; route: { params: StubParams } };

function AmountStub({ navigation, route }: StubScreenProps) {
  const [transaction, setTransaction] = useState(() => route.params.transaction);
  return (
    <View>
      <XrpAfterAmountInput
        account={XRP_ACCOUNT as never}
        transaction={transaction as never}
        updateTransaction={updater => setTransaction(prev => updater(prev as never) as never)}
        maxSpendable={null}
      />
      <Text testID="amount-tag">{String(transaction.tag)}</Text>
      <Pressable
        testID="amount-continue"
        onPress={() =>
          navigation.navigate(ScreenName.SendSummary, {
            accountId: route.params.accountId,
            transaction,
          })
        }
      >
        <Text>continue</Text>
      </Pressable>
    </View>
  );
}

function SummaryStub({ navigation, route }: StubScreenProps) {
  const [transaction, setTransaction] = useState(() => route.params.transaction);
  useTransactionChangeFromNavigation(setTransaction as never);
  return (
    <View>
      <XrpTagRow
        account={XRP_ACCOUNT}
        transaction={transaction}
        navigation={navigation as never}
        route={route as never}
      />
      <Pressable testID="summary-back" onPress={() => navigation.goBack()}>
        <Text>back</Text>
      </Pressable>
    </View>
  );
}

function EditTagStub({ navigation, route }: StubScreenProps) {
  // Mirrors ScreenEditTag.onValidateText: sync the amount step, then popTo the summary.
  const onValidate = () => {
    const updatedTransaction = { ...route.params.transaction, tag: 123 };
    syncTransactionToAmountStep(navigation as never, updatedTransaction as never);
    popToScreen(navigation, ScreenName.SendSummary, {
      accountId: route.params.accountId,
      transaction: updatedTransaction,
    });
  };
  return (
    <Pressable testID="save-tag-123" onPress={onValidate}>
      <Text>save</Text>
    </Pressable>
  );
}

const RootStack = createNativeStackNavigator();
const SendStack = createNativeStackNavigator();

function SendFundsNested() {
  return (
    <SendStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={ScreenName.SendAmountCoin}
    >
      <SendStack.Screen name={ScreenName.SendAmountCoin} component={AmountStub as never} />
      <SendStack.Screen name={ScreenName.SendSummary} component={SummaryStub as never} />
    </SendStack.Navigator>
  );
}

function Harness() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name={NavigatorName.SendFunds} component={SendFundsNested} />
      <RootStack.Screen name={ScreenName.XrpEditTag} component={EditTagStub as never} />
    </RootStack.Navigator>
  );
}

function renderFlow() {
  return render(<Harness />, {
    navigationInitialState: {
      index: 0,
      routes: [
        {
          name: NavigatorName.SendFunds,
          state: {
            index: 0,
            routes: [
              {
                name: ScreenName.SendAmountCoin,
                params: { accountId: XRP_ACCOUNT.id, transaction: makeTransaction(1234) },
              },
            ],
          },
        },
      ],
    },
  });
}

describe("XRP memo tag revert (integration)", () => {
  it("keeps the tag edited on the summary after navigating back to the amount step and returning", async () => {
    const { user } = renderFlow();

    expect(await screen.findByTestId("amount-tag")).toHaveTextContent("1234");

    await user.press(screen.getByTestId("amount-continue"));
    expect(await screen.findByTestId("summary-memo-tag")).toHaveTextContent("1234");

    await user.press(screen.getByText("Edit"));
    await user.press(await screen.findByTestId("save-tag-123"));
    expect(await screen.findByTestId("summary-memo-tag")).toHaveTextContent("123");

    // The edit survives back-navigation to the amount step, not reverting to 1234 (LIVE-35403).
    await user.press(screen.getByTestId("summary-back"));
    expect(await screen.findByTestId("amount-tag")).toHaveTextContent("123");

    await user.press(screen.getByTestId("amount-continue"));
    expect(await screen.findByTestId("summary-memo-tag")).toHaveTextContent("123");
  });
});
