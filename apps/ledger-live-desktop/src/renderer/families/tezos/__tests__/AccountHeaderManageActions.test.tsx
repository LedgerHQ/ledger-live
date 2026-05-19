import { act } from "react";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { renderHook, withFlagOverrides } from "tests/testSetup";

type StakingInfo = ReturnType<
  typeof import("@ledgerhq/live-common/families/tezos/react").useTezosStakingInfo
>;

const stakingInfoMock = jest.fn<StakingInfo, []>();

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  __esModule: true,
  useTezosStakingInfo: () => stakingInfoMock(),
}));

import AccountHeaderActions from "../AccountHeaderManageActions";

setSupportedCurrencies(["tezos"]);

const currency = getCryptoCurrencyById("tezos");

const makeAccount = (): TezosAccount =>
  ({
    ...genAccount("tezos-test", { currency }),
  }) as unknown as TezosAccount;

const makeEmptyAccount = (): TezosAccount =>
  ({
    ...genAccount("tezos-empty", { currency }),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operations: [],
    operationsCount: 0,
    subAccounts: [],
  }) as unknown as TezosAccount;

const defaultStakingInfo: StakingInfo = {
  isDelegated: false,
  isStaked: false,
  hasUnstaking: false,
  delegation: null,
  stakedBalance: new BigNumber(0),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(1000),
  delegateAddress: undefined,
};

beforeEach(() => {
  stakingInfoMock.mockReturnValue(defaultStakingInfo);
});

describe("AccountHeaderManageActions (tezos)", () => {
  const hook = AccountHeaderActions;
  invariant(hook, "tezos: type guard AccountHeaderActions");

  it("returns null when called with a parentAccount (sub-account)", () => {
    const account = makeAccount();
    const { result } = renderHook(() =>
      hook({ account, parentAccount: account, source: "Account Page" }),
    );
    expect(result.current).toBeNull();
  });

  it("opens MODAL_NO_FUNDS_STAKE when account is empty", () => {
    const account = makeEmptyAccount();
    const { result, store } = renderHook(() =>
      hook({ account, parentAccount: null, source: "Account Page" }),
    );

    act(() => {
      result.current?.[0].onClick();
    });

    expect(store.getState().modals.MODAL_NO_FUNDS_STAKE?.isOpened).toBe(true);
  });

  describe("when lldTezosStaking is enabled", () => {
    const initialState = withFlagOverrides({ lldTezosStaking: { enabled: true } });

    it("opens MODAL_TEZOS_EARNING_CHOICE when not delegated and not staked", () => {
      const account = makeAccount();
      const { result, store } = renderHook(
        () => hook({ account, parentAccount: null, source: "Account Page" }),
        { initialState },
      );

      act(() => {
        result.current?.[0].onClick();
      });

      expect(store.getState().modals.MODAL_TEZOS_EARNING_CHOICE?.isOpened).toBe(true);
    });

    it("opens MODAL_DELEGATE in redelegate mode when account is already delegated", () => {
      stakingInfoMock.mockReturnValue({
        ...defaultStakingInfo,
        isDelegated: true,
        delegation: {
          address: "tz1baker",
        } as StakingInfo["delegation"],
        delegateAddress: "tz1baker",
      });
      const account = makeAccount();
      const { result, store } = renderHook(
        () => hook({ account, parentAccount: null, source: "Account Page" }),
        { initialState },
      );

      act(() => {
        result.current?.[0].onClick();
      });

      const modal = store.getState().modals.MODAL_DELEGATE;
      expect(modal).toEqual(
        expect.objectContaining({
          isOpened: true,
          data: expect.objectContaining({ eventType: "redelegate" }),
        }),
      );
    });

    it("opens MODAL_DELEGATE (not earning choice) when staked but not delegated", () => {
      stakingInfoMock.mockReturnValue({
        ...defaultStakingInfo,
        isStaked: true,
        stakedBalance: new BigNumber(500),
      });
      const account = makeAccount();
      const { result, store } = renderHook(
        () => hook({ account, parentAccount: null, source: "Account Page" }),
        { initialState },
      );

      act(() => {
        result.current?.[0].onClick();
      });

      expect(store.getState().modals.MODAL_TEZOS_EARNING_CHOICE?.isOpened).toBeFalsy();
      expect(store.getState().modals.MODAL_DELEGATE?.isOpened).toBe(true);
    });
  });

  describe("when lldTezosStaking is disabled", () => {
    it("opens MODAL_DELEGATE plain for an account that is neither delegated nor staked", () => {
      const account = makeAccount();
      const { result, store } = renderHook(() =>
        hook({ account, parentAccount: null, source: "Account Page" }),
      );

      act(() => {
        result.current?.[0].onClick();
      });

      const modal = store.getState().modals.MODAL_DELEGATE;
      expect(modal).toEqual(
        expect.objectContaining({
          isOpened: true,
          data: expect.not.objectContaining({ eventType: expect.anything() }),
        }),
      );
      expect(store.getState().modals.MODAL_TEZOS_EARNING_CHOICE?.isOpened).toBeFalsy();
    });
  });
});
