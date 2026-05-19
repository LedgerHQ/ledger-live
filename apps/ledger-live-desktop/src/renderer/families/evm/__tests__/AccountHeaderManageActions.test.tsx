import { act } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { Account } from "@ledgerhq/types-live";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import AccountHeaderActions from "../AccountHeaderManageActions";

setSupportedCurrencies(["sei_evm"]);
const seiEvmCurrency = getCryptoCurrencyById("sei_evm");

const emptyStakingResources = {
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
}: {
  withStakingResources?: boolean;
  spendableBalance?: BigNumber;
  operations?: Account["operations"];
} = {}): Account => {
  const base = genAccount("sei_evm-test", { currency: seiEvmCurrency });
  return {
    ...base,
    balance: spendableBalance,
    spendableBalance,
    ...(operations !== undefined && { operations, operationsCount: operations.length }),
    ...(withStakingResources && { stakingResources: emptyStakingResources }),
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

    it("opens MODAL_NO_FUNDS_STAKE on click", () => {
      const account = makeSeiAccount({ spendableBalance: new BigNumber(0) });
      const { result, store } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      act(() => {
        result.current?.[0].onClick();
      });

      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBe(true);
      expect(store.getState().modals.MODAL_EVM_DELEGATE?.isOpened).toBe(undefined);
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

    it("opens MODAL_EVM_DELEGATE when clicking the action on a funded account", () => {
      const account = makeSeiAccount();
      const { result, store } = renderHook(() => hook({ account, parentAccount: null }), {
        initialState: seiEvmEnabledFlags,
      });

      act(() => {
        result.current?.[0].onClick();
      });

      expect(store.getState().modals.MODAL_EVM_DELEGATE?.isOpened).toBe(true);
      expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBe(undefined);
    });
  });
});
