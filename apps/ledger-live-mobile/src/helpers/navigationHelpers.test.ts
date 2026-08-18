import { CommonActions } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { popToScreen } from "./navigationHelpers";

const transaction = { family: "generic", memo: "123" };

const navigatorKey = "sendfunds-stack-key";
const recipientStep = { name: ScreenName.SendSelectRecipient, key: "recipient-key" };
const amountStep = { name: ScreenName.SendAmountCoin, key: "amount-key" };
const summaryStep = { name: ScreenName.SendSummary, key: "summary-key" };
const editStep = { name: ScreenName.XrpEditTag, key: "edit-key" };

type Step = { name: string; key?: string; state?: StackState };
type StackState = { key?: string; routes: Step[] };

// Production registers the edit screen as a sibling of the SendFunds navigator, so its state is the
// base stack and the steps live one level down.
const baseStackWith = (steps: Step[]): StackState => ({
  key: "base-key",
  routes: [
    {
      name: NavigatorName.SendFunds,
      key: "sendfunds-route-key",
      state: { key: navigatorKey, routes: [...steps, summaryStep] },
    },
    editStep,
  ],
});

// A flow registering its edit screen inside its own stack reaches the steps directly.
const sendStackWith = (steps: Step[]): StackState => ({
  key: navigatorKey,
  routes: [...steps, summaryStep, editStep],
});

const makeNavigation = (state: StackState) => ({
  popTo: jest.fn(),
  dispatch: jest.fn(),
  getState: () => state,
});

const setParamsOn = (sourceKey: string) => ({
  ...CommonActions.setParams({ transaction }),
  source: sourceKey,
  target: navigatorKey,
});

describe("popToScreen", () => {
  it("pops to the summary's navigator with the wrapped screen params", () => {
    const navigation = makeNavigation(baseStackWith([recipientStep, amountStep]));
    const params = { accountId: "js:2:ripple:rTest:", transaction };

    popToScreen(navigation, ScreenName.SendSummary, params);

    expect(navigation.popTo).toHaveBeenCalledTimes(1);
    expect(navigation.popTo).toHaveBeenCalledWith(NavigatorName.SendFunds, {
      screen: ScreenName.SendSummary,
      params,
    });
  });

  it("mirrors the edited transaction onto every step keeping its own copy", () => {
    const navigation = makeNavigation(sendStackWith([recipientStep, amountStep]));

    popToScreen(navigation, ScreenName.SendSummary, { transaction });

    expect(navigation.dispatch).toHaveBeenCalledTimes(2);
    expect(navigation.dispatch).toHaveBeenCalledWith(setParamsOn("recipient-key"));
    expect(navigation.dispatch).toHaveBeenCalledWith(setParamsOn("amount-key"));
  });

  it("mirrors the edited transaction onto steps nested inside the send navigator", () => {
    const navigation = makeNavigation(baseStackWith([recipientStep, amountStep]));

    popToScreen(navigation, ScreenName.SendSummary, { transaction });

    expect(navigation.dispatch).toHaveBeenCalledTimes(2);
    expect(navigation.dispatch).toHaveBeenCalledWith(setParamsOn("recipient-key"));
    expect(navigation.dispatch).toHaveBeenCalledWith(setParamsOn("amount-key"));
  });

  it("skips the amount step when the recipient went straight to the summary", () => {
    const navigation = makeNavigation(sendStackWith([recipientStep]));

    popToScreen(navigation, ScreenName.SendSummary, { transaction });

    expect(navigation.dispatch).toHaveBeenCalledTimes(1);
    expect(navigation.dispatch).toHaveBeenCalledWith(setParamsOn("recipient-key"));
  });

  it("still pops when no earlier step is in the stack", () => {
    const navigation = makeNavigation(baseStackWith([]));

    popToScreen(navigation, ScreenName.SendSummary, { transaction });

    expect(navigation.dispatch).not.toHaveBeenCalled();
    expect(navigation.popTo).toHaveBeenCalledTimes(1);
  });

  it("still pops when the stack has no key yet", () => {
    const navigation = makeNavigation({ routes: [recipientStep, amountStep, summaryStep] });

    popToScreen(navigation, ScreenName.SendSummary, { transaction });

    expect(navigation.dispatch).not.toHaveBeenCalled();
    expect(navigation.popTo).toHaveBeenCalledTimes(1);
  });

  it("still pops when the params carry no transaction", () => {
    const navigation = makeNavigation(sendStackWith([recipientStep, amountStep]));

    popToScreen(navigation, ScreenName.SendSummary, { accountId: "js:2:ripple:rTest:" });

    expect(navigation.dispatch).not.toHaveBeenCalled();
    expect(navigation.popTo).toHaveBeenCalledTimes(1);
  });

  it("still pops for summaries outside the send flow", () => {
    const navigation = makeNavigation(sendStackWith([recipientStep, amountStep]));

    popToScreen(navigation, ScreenName.SwapForm, { transaction });

    expect(navigation.dispatch).not.toHaveBeenCalled();
    expect(navigation.popTo).toHaveBeenCalledWith(NavigatorName.Swap, {
      screen: ScreenName.SwapForm,
      params: { transaction },
    });
  });
});
