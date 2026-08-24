import BigNumber from "bignumber.js";
import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { NavigatorName, ScreenName } from "~/const";
import accountActions from "../accountActions";

// canStakeICP is exercised by live-common's own tests; here we only need its branching, so mock
// it to the same `spendableBalance >= MIN_NEURON_STAKE + ICP_FEES` rule (100_000_000 + 10_000).
jest.mock("@ledgerhq/live-common/families/internet_computer/react", () => ({
  canStakeICP: (account: { spendableBalance: BigNumber }) =>
    account.spendableBalance.gte(100_010_000),
}));

jest.mock("~/context/Locale", () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
}));

jest.mock("~/helpers/getStakeLabelLocaleBased", () => ({
  getStakeLabelLocaleBased: () => "account.stake",
}));

const ENOUGH_TO_STAKE = new BigNumber(100_010_000);
const NOT_ENOUGH_TO_STAKE = new BigNumber(100_009_999);

const makeAccount = (over: Record<string, unknown> = {}): ICPAccount =>
  ({
    type: "Account",
    id: "icp-1",
    spendableBalance: ENOUGH_TO_STAKE,
    neurons: { fullNeurons: [], lastUpdatedMSecs: 0 },
    ...over,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  }) as unknown as ICPAccount;

const callMainActions = (account: ICPAccount, flag?: { enabled?: boolean } | null) =>
  accountActions.getMainActions({ account, llmIcpStaking: flag });

const screenOf = (action: { navigationParams?: readonly [string, object] }) =>
  (action.navigationParams?.[1] as { screen: string }).screen;

describe("internet_computer accountActions.getMainActions", () => {
  it("returns no actions when the feature flag is disabled or absent", () => {
    expect(callMainActions(makeAccount(), { enabled: false })).toEqual([]);
    expect(callMainActions(makeAccount(), null)).toEqual([]);
  });

  it("returns no actions for a non-Account (token) account", () => {
    const tokenAccount = { ...makeAccount(), type: "TokenAccount" } as unknown as ICPAccount;
    expect(callMainActions(tokenAccount, { enabled: true })).toEqual([]);
  });

  it("routes Stake into the staking flow when the balance can afford a neuron", () => {
    const [stake] = callMainActions(makeAccount({ spendableBalance: ENOUGH_TO_STAKE }), {
      enabled: true,
    });

    expect(stake.id).toBe("stake");
    expect(stake.navigationParams?.[0]).toBe(NavigatorName.InternetComputerStakingFlow);
    expect(screenOf(stake)).toBe(ScreenName.InternetComputerStakingStarted);
  });

  it("routes Stake to NoFundsFlow when the balance is below the minimum", () => {
    const [stake] = callMainActions(makeAccount({ spendableBalance: NOT_ENOUGH_TO_STAKE }), {
      enabled: true,
    });

    expect(stake.id).toBe("stake");
    expect(stake.navigationParams?.[0]).toBe(NavigatorName.NoFundsFlow);
    expect(screenOf(stake)).toBe(ScreenName.NoFunds);
  });

  it("offers Manage Neurons after Stake once staking is enabled", () => {
    const actions = callMainActions(
      makeAccount({
        spendableBalance: ENOUGH_TO_STAKE,
        neurons: { fullNeurons: [{}], lastUpdatedMSecs: 0 },
      }),
      { enabled: true },
    );

    expect(actions.map(a => a.id)).toEqual(["stake", "manage-neurons"]);
    expect(actions[1].navigationParams?.[0]).toBe(NavigatorName.InternetComputerNeuronManageFlow);
    expect(screenOf(actions[1])).toBe(ScreenName.InternetComputerNeuronList);
  });

  // The two sit side by side in the action row, and every other family's staking action uses
  // CoinsMedium — sharing it made the pair indistinguishable at a glance.
  it("gives the two staking actions different icons", () => {
    const actions = callMainActions(makeAccount({ spendableBalance: ENOUGH_TO_STAKE }), {
      enabled: true,
    });

    expect(actions[0].Icon).not.toBe(actions[1].Icon);
  });

  it("offers Manage Neurons before any neuron exists, since Sync lives inside it", () => {
    const actions = callMainActions(makeAccount({ neurons: { fullNeurons: [] } }), {
      enabled: true,
    });

    expect(actions.map(a => a.id)).toEqual(["stake", "manage-neurons"]);
  });

  it("shows Manage alongside a NoFunds-routed Stake when the balance is too low", () => {
    const actions = callMainActions(
      makeAccount({
        spendableBalance: NOT_ENOUGH_TO_STAKE,
        neurons: { fullNeurons: [{}], lastUpdatedMSecs: 0 },
      }),
      { enabled: true },
    );

    expect(actions.map(a => a.id)).toEqual(["stake", "manage-neurons"]);
    expect(actions[0].navigationParams?.[0]).toBe(NavigatorName.NoFundsFlow);
  });

  it("threads accountId and source route into the stake nav params", () => {
    const source = { name: "Portfolio" } as unknown as Parameters<
      typeof accountActions.getMainActions
    >[0]["parentRoute"];

    const [stake] = accountActions.getMainActions({
      account: makeAccount({ id: "icp-42" }),
      parentRoute: source,
      llmIcpStaking: { enabled: true },
    });

    expect((stake.navigationParams?.[1] as { params: object }).params).toEqual({
      accountId: "icp-42",
      source,
    });
  });
});
