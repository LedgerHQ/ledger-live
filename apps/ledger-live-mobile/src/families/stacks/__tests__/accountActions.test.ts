import BigNumber from "bignumber.js";
import { NavigatorName, ScreenName } from "~/const";
import ZeroBalanceDisabledModalContent from "~/components/FabActions/modals/ZeroBalanceDisabledModalContent";
import accountActions from "../accountActions";
import { makeStacksAccount, makeStakingPosition } from "../__mocks__/account.mock";

jest.mock("@ledgerhq/native-ui", () => ({
  IconsLegacy: { CoinsMedium: "CoinsMedium" },
}));

jest.mock("~/components/FabActions/modals/ZeroBalanceDisabledModalContent", () => ({
  __esModule: true,
  default: "ZeroBalanceDisabledModalContent",
}));

jest.mock("~/context/Locale", () => ({
  i18n: { t: (key: string) => key },
}));

const actionIds = (account: Parameters<typeof accountActions.getMainActions>[0]["account"]) =>
  accountActions.getMainActions({ account }).map(action => action.id);

describe("stacks accountActions.getMainActions", () => {
  it("offers Stake only when there is no staking position", () => {
    const [stake, ...rest] = accountActions.getMainActions({ account: makeStacksAccount() });

    expect(rest).toEqual([]);
    expect(stake.id).toBe("stake");
    expect(stake.disabled).toBe(false);
    expect(stake.navigationParams).toEqual([
      NavigatorName.StacksStakingFlow,
      expect.objectContaining({ screen: ScreenName.StacksStakingPool }),
    ]);
  });

  it("offers Unstake only while the position allows undelegating", () => {
    const account = makeStacksAccount({}, [makeStakingPosition()]);
    const [unstake, ...rest] = accountActions.getMainActions({
      account,
      canStakeUsingLedgerLive: true,
    });

    expect(rest).toEqual([]);
    expect(unstake.id).toBe("unstake");
    expect(unstake.navigationParams).toEqual([
      NavigatorName.StacksUnstakingFlow,
      expect.objectContaining({
        screen: ScreenName.StacksUnstakingSummary,
        params: expect.objectContaining({ accountId: account.id }),
      }),
    ]);
  });

  it("hides Unstake when Stacks isn't listed in stakePrograms", () => {
    const account = makeStacksAccount({}, [makeStakingPosition()]);

    expect(actionIds(account)).toEqual([]);
    expect(
      accountActions
        .getMainActions({ account, canStakeUsingLedgerLive: false })
        .map(action => action.id),
    ).toEqual([]);
  });

  it("hides both actions for a deactivating position (pox-5 rejects a second stake)", () => {
    const account = makeStacksAccount({}, [
      makeStakingPosition({ state: "deactivating", actions: [] }),
    ]);

    expect(
      accountActions
        .getMainActions({ account, canStakeUsingLedgerLive: true })
        .map(action => action.id),
    ).toEqual([]);
  });

  it("hides Stake when the staking position lookup failed", () => {
    expect(actionIds(makeStacksAccount({}, null))).toEqual([]);
  });

  it("disables Stake with the zero-balance modal when nothing is spendable", () => {
    const [stake] = accountActions.getMainActions({
      account: makeStacksAccount({ spendableBalance: new BigNumber(0) }),
    });

    expect(stake.disabled).toBe(true);
    expect(stake.modalOnDisabledClick?.component).toBe(ZeroBalanceDisabledModalContent);
  });

  it("returns nothing for a token account", () => {
    const account = { ...makeStacksAccount(), type: "TokenAccount" } as unknown as Parameters<
      typeof accountActions.getMainActions
    >[0]["account"];

    expect(actionIds(account)).toEqual([]);
  });
});
