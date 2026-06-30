import { act } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { Account, StakingResources } from "@ledgerhq/types-live";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import AccountHeaderActions from "../AccountHeaderManageActions";

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => {
  const { defaultIsAccountEmpty } = jest.requireActual(
    "@ledgerhq/live-common/bridge/defaultBridgeExtensions",
  );
  return {
    useAccountBridge: jest.fn(() => ({ isAccountEmpty: defaultIsAccountEmpty })),
    useAccountBridgeOrNull: jest.fn(() => ({ isAccountEmpty: defaultIsAccountEmpty })),
    useAccountBridgeMany: jest.fn((accounts: Account[]) =>
      accounts.map(() => ({ isAccountEmpty: defaultIsAccountEmpty })),
    ),
  };
});

const seiEvmCurrency = getCryptoCurrencyById("sei_evm");

const emptyStakingResources: StakingResources = {
  delegatedBalance: new BigNumber(0),
  pendingRewardsBalance: new BigNumber(0),
  unbondingBalance: new BigNumber(0),
  delegations: [],
  redelegations: [],
  unbondings: [],
  validators: [],
};

const makeSeiAccount = ({
  withStakingResources = true,
  spendableBalance = new BigNumber(1_000),
  operations,
  stakingResources = emptyStakingResources,
}: {
  withStakingResources?: boolean;
  spendableBalance?: BigNumber;
  operations?: Account["operations"];
  stakingResources?: StakingResources;
} = {}): Account => {
  const base = genAccount("sei_evm-test", { currency: seiEvmCurrency });
  return {
    ...base,
    balance: spendableBalance,
    spendableBalance,
    ...(operations !== undefined && { operations, operationsCount: operations.length }),
    ...(withStakingResources && { stakingResources }),
  } as Account;
};

const seiEvmEnabledFlags = withFlagOverrides({
  evmNativeStaking: { enabled: true, params: { supportedCurrencyIds: ["sei_evm"] } },
});

describe("EVM AccountHeaderManageActions", () => {
  const hook = AccountHeaderActions;
  invariant(hook, "evm: type guard AccountHeaderActions");

  describe("when sei_evm staking is gated out", () => {
    it("returns an empty array when account has no stakingResources", () => {
      const account = makeSeiAccount({ withStakingResources: false });
      const { result } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      expect(result.current).toEqual([]);
    });

    it("returns an empty array when feature flag is disabled", () => {
      const account = makeSeiAccount();
      const { result } = renderHook(() => hook({ account, parentAccount: null }));

      expect(result.current).toEqual([]);
    });

    it("returns an empty array when currency is not in supportedCurrencyIds", () => {
      const account = makeSeiAccount();
      const { result } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: withFlagOverrides({
          evmNativeStaking: { enabled: true, params: { supportedCurrencyIds: [] } },
        }),
      });

      expect(result.current).toEqual([]);
    });
  });

  describe("when sei_evm account has zero spendable balance", () => {
    it("still returns a Stake action", () => {
      const account = makeSeiAccount({ spendableBalance: new BigNumber(0) });
      const { result } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      expect(result.current).toEqual([
        expect.objectContaining({ key: "Stake", accountActionsTestId: "stake-button" }),
      ]);
    });

    it("opens MODAL_EVM_REWARDS_INFO on click", () => {
      const account = makeSeiAccount({ spendableBalance: new BigNumber(0) });
      const { result, store } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      act(() => {
        result.current?.[0].onClick();
      });

      expect(store.getState().modals.MODAL_EVM_REWARDS_INFO?.isOpened).toBe(true);
      expect(store.getState().modals.MODAL_EVM_DELEGATE?.isOpened).toBe(undefined);
    });

    it("opens MODAL_EVM_DELEGATE on click when the account already has delegations", () => {
      // A fully-staked account has 0 spendable balance but existing delegations; it must
      // reach the delegate/manage flow rather than the first-timer info screen.
      const account = makeSeiAccount({
        spendableBalance: new BigNumber(0),
        stakingResources: {
          ...emptyStakingResources,
          delegations: [
            {
              validatorAddress: "seivaloper1xyz",
              amount: new BigNumber(1_000),
              pendingRewards: new BigNumber(0),
              status: "bonded",
            },
          ],
        },
      });
      const { result, store } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      act(() => {
        result.current?.[0].onClick();
      });

      expect(store.getState().modals.MODAL_EVM_DELEGATE?.isOpened).toBe(true);
      expect(store.getState().modals.MODAL_EVM_REWARDS_INFO?.isOpened).toBe(undefined);
    });
  });

  describe("when sei_evm staking is fully enabled", () => {
    it("returns a single Stake action", () => {
      const account = makeSeiAccount();
      const { result } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      expect(result.current).toHaveLength(1);
      expect(result.current?.[0]).toEqual(
        expect.objectContaining({
          key: "Stake",
          accountActionsTestId: "stake-button",
        }),
      );
    });

    it("opens MODAL_EVM_REWARDS_INFO when clicking the action on a funded account with no delegations", () => {
      const account = makeSeiAccount();
      const { result, store } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      act(() => {
        result.current?.[0].onClick();
      });

      // First-time delegators see the info/starter screen first; it routes on to
      // MODAL_EVM_DELEGATE via its own onNext after the user continues.
      expect(store.getState().modals.MODAL_EVM_REWARDS_INFO?.isOpened).toBe(true);
      expect(store.getState().modals.MODAL_EVM_DELEGATE?.isOpened).toBe(undefined);
    });

    it("opens MODAL_EVM_DELEGATE when clicking the action on a funded account with existing delegations", () => {
      const account = makeSeiAccount({
        stakingResources: {
          ...emptyStakingResources,
          delegations: [
            {
              validatorAddress: "seivaloper1xyz",
              amount: new BigNumber(1_000),
              pendingRewards: new BigNumber(0),
              status: "bonded",
            },
          ],
        },
      });
      const { result, store } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      act(() => {
        result.current?.[0].onClick();
      });

      expect(store.getState().modals.MODAL_EVM_DELEGATE?.isOpened).toBe(true);
      expect(store.getState().modals.MODAL_EVM_REWARDS_INFO?.isOpened).toBe(undefined);
    });
  });
});
