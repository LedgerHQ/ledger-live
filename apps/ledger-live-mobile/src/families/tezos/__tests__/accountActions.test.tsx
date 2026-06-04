import type { Account } from "@ledgerhq/types-live";
import type { TezosEarnFlow } from "@ledgerhq/live-common/families/tezos/earnFlow";
import { NavigatorName, ScreenName } from "~/const";
import accountActions from "../accountActions";

let mockFlow: TezosEarnFlow;
jest.mock("@ledgerhq/live-common/families/tezos/earnFlow", () => ({
  getTezosEarnFlow: () => mockFlow,
}));

jest.mock("@ledgerhq/live-common/families/tezos/staking", () => ({
  isAccountDelegating: () => false,
  getAccountDelegationSync: () => null,
}));

jest.mock("@ledgerhq/live-common/bridge/defaultBridgeExtensions", () => ({
  defaultIsAccountEmpty: () => false,
}));

jest.mock("~/context/Locale", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getStakeLabelLocaleBased: () => "account.stake",
}));

const makeAccount = (over: Partial<Account> = {}): Account =>
  ({
    type: "Account",
    id: "acc-1",
    ...over,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }) as Account;

const callMainActions = (flag?: { enabled?: boolean } | null) =>
  accountActions.getMainActions({
    account: makeAccount(),
    parentAccount: makeAccount({ id: "parent-1" }),
    llmTezosStaking: flag,
  });

describe("Tezos accountActions.getMainActions", () => {
  it("routes the no-funds flow to the NoFunds modal", () => {
    mockFlow = { kind: "no-funds" };
    const [action] = callMainActions({ enabled: true });
    expect(action.navigationParams?.[0]).toBe(NavigatorName.NoFundsFlow);
    expect((action.navigationParams?.[1] as { screen: string }).screen).toBe(ScreenName.NoFunds);
  });

  it("routes the earning-choice flow to the Tezos Earn Rewards screen", () => {
    mockFlow = { kind: "earning-choice" };
    const [action] = callMainActions({ enabled: true });
    expect(action.navigationParams?.[0]).toBe(NavigatorName.TezosDelegationFlow);
    expect((action.navigationParams?.[1] as { screen: string }).screen).toBe(
      ScreenName.TezosEarnRewards,
    );
  });

  it("routes the stake flow to the Tezos Earn Rewards screen until the stake flow lands", () => {
    mockFlow = { kind: "stake", skipDelegation: true };
    const [action] = callMainActions({ enabled: true });
    expect(action.navigationParams?.[0]).toBe(NavigatorName.TezosDelegationFlow);
    expect((action.navigationParams?.[1] as { screen: string }).screen).toBe(
      ScreenName.TezosEarnRewards,
    );
  });

  it("routes a fresh delegation to DelegationStarted", () => {
    mockFlow = { kind: "delegate", redelegate: false };
    const [action] = callMainActions(null);
    expect(action.navigationParams?.[0]).toBe(NavigatorName.TezosDelegationFlow);
    expect((action.navigationParams?.[1] as { screen: string }).screen).toBe(
      ScreenName.DelegationStarted,
    );
  });

  it("routes a redelegation straight to the DelegationSummary step", () => {
    mockFlow = { kind: "delegate", redelegate: true };
    const [action] = callMainActions(null);
    expect(action.navigationParams?.[0]).toBe(NavigatorName.TezosDelegationFlow);
    expect((action.navigationParams?.[1] as { screen: string }).screen).toBe(
      ScreenName.DelegationSummary,
    );
  });

  it("threads account/parent ids and source route into earn params", () => {
    mockFlow = { kind: "earning-choice" };
    const source = { name: "Portfolio" } as unknown as Parameters<
      typeof accountActions.getMainActions
    >[0]["parentRoute"];
    const [action] = accountActions.getMainActions({
      account: makeAccount({ id: "tezos-42" }),
      parentAccount: makeAccount({ id: "parent-7" }),
      parentRoute: source,
      llmTezosStaking: { enabled: true },
    });
    expect((action.navigationParams?.[1] as { params: object }).params).toEqual({
      accountId: "tezos-42",
      parentId: "parent-7",
      source,
    });
  });
});
