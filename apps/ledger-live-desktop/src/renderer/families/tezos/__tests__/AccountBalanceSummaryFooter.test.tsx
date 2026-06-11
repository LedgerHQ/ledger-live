import React from "react";
import BigNumber from "bignumber.js";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import * as currencies from "@ledgerhq/live-common/currencies/index";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
}));

jest.mock("~/renderer/hooks/useAccountUnit");

type StakingInfo = ReturnType<
  typeof import("@ledgerhq/live-common/families/tezos/react").useTezosStakingInfo
>;

const stakingInfoMock = jest.fn<StakingInfo, []>();

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  __esModule: true,
  useTezosStakingInfo: () => stakingInfoMock(),
}));

import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";

setSupportedCurrencies(["tezos"]);

const currency = getCryptoCurrencyById("tezos");

const SPENDABLE = new BigNumber(1_000_000);
const DELEGATED_AVAILABLE = new BigNumber(700_000);
const STAKED = new BigNumber(300_000);
const UNSTAKING = new BigNumber(50_000);
const FINALIZABLE = new BigNumber(20_000);

const makeAccount = (): TezosAccount => {
  const account = {
    ...genAccount("tezos-test", { currency }),
    balance: new BigNumber(1_070_000),
    spendableBalance: SPENDABLE,
  } as unknown as TezosAccount;
  if (account.type !== "Account") {
    throw new Error("makeAccount expected type=Account; tests would pass vacuously otherwise");
  }
  return account;
};

const defaultStakingInfo: StakingInfo = {
  isDelegated: false,
  isStaked: false,
  hasUnstaking: false,
  delegation: null,
  stakedBalance: new BigNumber(0),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(0),
  delegateAddress: undefined,
  unstakingPositions: [],
};

const delegatedInfo: StakingInfo = {
  ...defaultStakingInfo,
  isDelegated: true,
  availableBalance: DELEGATED_AVAILABLE,
};

const stakingOn = withFlagOverrides({ lldTezosStaking: { enabled: true } });

beforeEach(() => {
  stakingInfoMock.mockReturnValue(defaultStakingInfo);
  jest.spyOn(currencies, "formatCurrencyUnit").mockImplementation((_unit, value) => {
    if (!value) return "";
    if (value.eq(SPENDABLE)) return "available:1.0";
    if (value.eq(DELEGATED_AVAILABLE)) return "delegated:0.7";
    if (value.eq(STAKED)) return "staked:0.3";
    if (value.eq(UNSTAKING)) return "pending:0.05";
    if (value.eq(FINALIZABLE)) return "withdrawable:0.02";
    if (value.eq(new BigNumber(0))) return "zero:0";
    return value.toString();
  });
});

describe("AccountBalanceSummaryFooter (tezos)", () => {
  it("renders nothing for a TokenAccount", () => {
    const tokenAccount = { type: "TokenAccount", id: "stub" } as unknown as TokenAccount;
    const { container } = render(<AccountBalanceSummaryFooter account={tokenAccount} />, {
      initialState: stakingOn,
    });
    expect(container.firstChild).toBeNull();
  });

  it("renders only Available Balance when not delegated", () => {
    render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("available:1.0")).toBeInTheDocument();
    expect(screen.queryByText("Delegated assets")).not.toBeInTheDocument();
    expect(screen.queryByText("Staked assets")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending withdrawable")).not.toBeInTheDocument();
    expect(screen.queryByText("Withdrawable assets")).not.toBeInTheDocument();
  });

  it("renders Available + Delegated when delegated but no staking", () => {
    stakingInfoMock.mockReturnValue(delegatedInfo);
    render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("Delegated assets")).toBeInTheDocument();
    expect(screen.getByText("delegated:0.7")).toBeInTheDocument();
    expect(screen.queryByText("Staked assets")).not.toBeInTheDocument();
  });

  it("renders Staked when isStaked is true", () => {
    stakingInfoMock.mockReturnValue({
      ...delegatedInfo,
      isStaked: true,
      stakedBalance: STAKED,
    });
    render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });

    expect(screen.getByText("Staked assets")).toBeInTheDocument();
    expect(screen.getByText("staked:0.3")).toBeInTheDocument();
  });

  it("renders Pending withdrawable when unstakedBalance > 0", () => {
    stakingInfoMock.mockReturnValue({
      ...delegatedInfo,
      hasUnstaking: true,
      unstakedBalance: UNSTAKING,
    });
    render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });

    expect(screen.getByText("Pending withdrawable")).toBeInTheDocument();
    expect(screen.getByText("pending:0.05")).toBeInTheDocument();
  });

  it("renders Withdrawable when unstakedFinalizable > 0", () => {
    stakingInfoMock.mockReturnValue({
      ...delegatedInfo,
      hasUnstaking: true,
      unstakedFinalizable: FINALIZABLE,
    });
    render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });

    expect(screen.getByText("Withdrawable assets")).toBeInTheDocument();
    expect(screen.getByText("withdrawable:0.02")).toBeInTheDocument();
  });

  it("renders all 5 cells with the correct values when delegated + staked + unstaking + finalizable", () => {
    stakingInfoMock.mockReturnValue({
      ...delegatedInfo,
      isStaked: true,
      hasUnstaking: true,
      stakedBalance: STAKED,
      unstakedBalance: UNSTAKING,
      unstakedFinalizable: FINALIZABLE,
    });
    render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("available:1.0")).toBeInTheDocument();
    expect(screen.getByText("Delegated assets")).toBeInTheDocument();
    expect(screen.getByText("delegated:0.7")).toBeInTheDocument();
    expect(screen.getByText("Staked assets")).toBeInTheDocument();
    expect(screen.getByText("staked:0.3")).toBeInTheDocument();
    expect(screen.getByText("Pending withdrawable")).toBeInTheDocument();
    expect(screen.getByText("pending:0.05")).toBeInTheDocument();
    expect(screen.getByText("Withdrawable assets")).toBeInTheDocument();
    expect(screen.getByText("withdrawable:0.02")).toBeInTheDocument();
  });

  it("hides Staked / Pending / Withdrawable when lldTezosStaking is disabled (still shows Available + Delegated with correct values)", () => {
    stakingInfoMock.mockReturnValue({
      ...delegatedInfo,
      isStaked: true,
      hasUnstaking: true,
      stakedBalance: STAKED,
      unstakedBalance: UNSTAKING,
      unstakedFinalizable: FINALIZABLE,
    });
    render(<AccountBalanceSummaryFooter account={makeAccount()} />);

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("available:1.0")).toBeInTheDocument();
    expect(screen.getByText("Delegated assets")).toBeInTheDocument();
    expect(screen.getByText("delegated:0.7")).toBeInTheDocument();
    expect(screen.queryByText("Staked assets")).not.toBeInTheDocument();
    expect(screen.queryByText("Pending withdrawable")).not.toBeInTheDocument();
    expect(screen.queryByText("Withdrawable assets")).not.toBeInTheDocument();
  });

  describe("zero-amount boundaries (gate is strictly > 0)", () => {
    it("hides Staked when isStaked is false even with flag on and delegated", () => {
      stakingInfoMock.mockReturnValue({ ...delegatedInfo, isStaked: false });
      render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });
      expect(screen.queryByText("Staked assets")).not.toBeInTheDocument();
    });

    it("hides Pending withdrawable when unstakedBalance is exactly 0", () => {
      stakingInfoMock.mockReturnValue({
        ...delegatedInfo,
        unstakedBalance: new BigNumber(0),
      });
      render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });
      expect(screen.queryByText("Pending withdrawable")).not.toBeInTheDocument();
    });

    it("hides Withdrawable when unstakedFinalizable is exactly 0", () => {
      stakingInfoMock.mockReturnValue({
        ...delegatedInfo,
        unstakedFinalizable: new BigNumber(0),
      });
      render(<AccountBalanceSummaryFooter account={makeAccount()} />, { initialState: stakingOn });
      expect(screen.queryByText("Withdrawable assets")).not.toBeInTheDocument();
    });
  });
});
