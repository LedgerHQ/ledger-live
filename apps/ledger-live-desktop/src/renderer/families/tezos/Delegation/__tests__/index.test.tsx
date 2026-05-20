import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import {
  getCryptoCurrencyById,
  setSupportedCurrencies,
} from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { useBaker, useTezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import type { TezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import Delegation from "../index";

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useBaker: jest.fn(),
  useTezosStakingInfo: jest.fn(),
}));

jest.mock("../StakingSection", () => ({
  __esModule: true,
  default: () => <div data-testid="staking-section" />,
}));
jest.mock("../UnstakingSection", () => ({
  __esModule: true,
  default: () => <div data-testid="unstaking-section" />,
}));
jest.mock("../Row", () => ({
  __esModule: true,
  default: () => <div data-testid="delegation-row" />,
}));
jest.mock("../Header", () => ({
  __esModule: true,
  default: () => <div data-testid="delegation-header" />,
}));

setSupportedCurrencies(["tezos"]);
const currency = getCryptoCurrencyById("tezos");
const account = { ...genAccount("tezos-index-test", { currency }) } as unknown as TezosAccount;

const mockedUseBaker = jest.mocked(useBaker);
const mockedStakingInfo = jest.mocked(useTezosStakingInfo);

const stakingOn = withFlagOverrides({ lldTezosStaking: { enabled: true } });

const baseInfo: TezosStakingInfo = {
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

const delegatedInfo: TezosStakingInfo = {
  ...baseInfo,
  isDelegated: true,
  delegation: {
    address: "tz1baker",
    baker: null,
    operation: { hash: "h", date: new Date() },
    isPending: false,
    receiveShouldWarnDelegation: false,
    sendShouldWarnDelegation: false,
  } as never,
  delegateAddress: "tz1baker",
  availableBalance: new BigNumber(100),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockedUseBaker.mockReturnValue(undefined as never);
});

describe("Delegation/index (tezos)", () => {
  it("renders the delegate CTA when account has no delegation", () => {
    mockedStakingInfo.mockReturnValue(baseInfo);
    render(<Delegation account={account} parentAccount={null} />);
    expect(screen.getByRole("button", { name: /earn rewards/i })).toBeInTheDocument();
    expect(screen.queryByTestId("delegation-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("staking-section")).not.toBeInTheDocument();
    expect(screen.queryByTestId("unstaking-section")).not.toBeInTheDocument();
  });

  it("renders the legacy Delegation row when delegated", () => {
    mockedStakingInfo.mockReturnValue(delegatedInfo);
    render(<Delegation account={account} parentAccount={null} />);
    expect(screen.getByTestId("delegation-row")).toBeInTheDocument();
    expect(screen.getByTestId("delegation-header")).toBeInTheDocument();
  });

  describe("with lldTezosStaking off", () => {
    it("never renders Staking/Unstaking sections, even when isStaked/hasUnstaking", () => {
      mockedStakingInfo.mockReturnValue({
        ...delegatedInfo,
        isStaked: true,
        hasUnstaking: true,
        stakedBalance: new BigNumber(50),
      });
      render(<Delegation account={account} parentAccount={null} />);
      expect(screen.queryByTestId("staking-section")).not.toBeInTheDocument();
      expect(screen.queryByTestId("unstaking-section")).not.toBeInTheDocument();
    });
  });

  describe("with lldTezosStaking on", () => {
    it("renders only the Delegation section when delegated but not staked and no unstaking", () => {
      mockedStakingInfo.mockReturnValue(delegatedInfo);
      render(<Delegation account={account} parentAccount={null} />, { initialState: stakingOn });
      expect(screen.getByTestId("delegation-row")).toBeInTheDocument();
      expect(screen.queryByTestId("staking-section")).not.toBeInTheDocument();
      expect(screen.queryByTestId("unstaking-section")).not.toBeInTheDocument();
    });

    it("renders Delegation + Staking when isStaked is true", () => {
      mockedStakingInfo.mockReturnValue({
        ...delegatedInfo,
        isStaked: true,
        stakedBalance: new BigNumber(50),
      });
      render(<Delegation account={account} parentAccount={null} />, { initialState: stakingOn });
      expect(screen.getByTestId("delegation-row")).toBeInTheDocument();
      expect(screen.getByTestId("staking-section")).toBeInTheDocument();
      expect(screen.queryByTestId("unstaking-section")).not.toBeInTheDocument();
    });

    it("renders Delegation + Unstaking when hasUnstaking is true", () => {
      mockedStakingInfo.mockReturnValue({
        ...delegatedInfo,
        hasUnstaking: true,
        unstakedBalance: new BigNumber(20),
      });
      render(<Delegation account={account} parentAccount={null} />, { initialState: stakingOn });
      expect(screen.getByTestId("delegation-row")).toBeInTheDocument();
      expect(screen.queryByTestId("staking-section")).not.toBeInTheDocument();
      expect(screen.getByTestId("unstaking-section")).toBeInTheDocument();
    });

    it("renders all three sections when isStaked and hasUnstaking", () => {
      mockedStakingInfo.mockReturnValue({
        ...delegatedInfo,
        isStaked: true,
        hasUnstaking: true,
        stakedBalance: new BigNumber(50),
        unstakedBalance: new BigNumber(20),
      });
      render(<Delegation account={account} parentAccount={null} />, { initialState: stakingOn });
      expect(screen.getByTestId("delegation-row")).toBeInTheDocument();
      expect(screen.getByTestId("staking-section")).toBeInTheDocument();
      expect(screen.getByTestId("unstaking-section")).toBeInTheDocument();
    });
  });

  it("returns null for a parent-account (sub-account) render", () => {
    mockedStakingInfo.mockReturnValue(baseInfo);
    const { container } = render(<Delegation account={account} parentAccount={account as never} />);
    expect(container.firstChild).toBeNull();
  });
});
