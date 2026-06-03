import React from "react";
import BigNumber from "bignumber.js";
import {
  isFinalizablePosition,
  useBaker,
  useDelegation,
  useTezosStakingInfo,
} from "@ledgerhq/live-common/families/tezos/react";
import { act, render, screen, withFlagOverrides } from "tests/testSetup";
import {
  createMockAccount,
  createMockDelegation,
  createMockUnstakingPosition,
  defaultStakingInfo,
} from "../../__tests__/testUtils";
import Delegation from "..";

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useBaker: jest.fn(),
  useDelegation: jest.fn(),
  useTezosStakingInfo: jest.fn(),
  isFinalizablePosition: jest.fn(),
}));

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  __esModule: true,
  useAccountBridge: () => ({ isAccountEmpty: () => false }),
}));

jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));

const MOCK_NOW = new Date("2030-01-01T00:00:00Z").getTime();
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const mockedUseBaker = jest.mocked(useBaker);
const mockedUseDelegation = jest.mocked(useDelegation);
const mockedUseTezosStakingInfo = jest.mocked(useTezosStakingInfo);
const mockedIsFinalizable = jest.mocked(isFinalizablePosition);

const stakingOn = withFlagOverrides({ lldTezosStaking: { enabled: true } });

const delegationFixture = () =>
  createMockDelegation({ operationDate: new Date(MOCK_NOW - ONE_DAY_MS) });

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(MOCK_NOW);
  mockedUseBaker.mockReturnValue({ address: "tz1baker", name: "Acme Baker" } as never);
  mockedUseDelegation.mockReturnValue(delegationFixture());
  mockedUseTezosStakingInfo.mockReturnValue(defaultStakingInfo);
  mockedIsFinalizable.mockReturnValue(false);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("Tezos staking dashboard (integration)", () => {
  it("renders the Earn CTA with no sub-sections when there is no delegation activity", () => {
    render(<Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />, {
      initialState: stakingOn,
    });

    expect(screen.getByRole("button", { name: /earn rewards/i })).toBeInTheDocument();
    expect(screen.queryByText(/^Staking$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Unstaking$/)).not.toBeInTheDocument();
    expect(screen.queryByText("Acme Baker")).not.toBeInTheDocument();
  });

  it("renders only the legacy Delegation row when delegated, flag off", () => {
    mockedUseTezosStakingInfo.mockReturnValue({
      ...defaultStakingInfo,
      isDelegated: true,
      delegation: delegationFixture(),
      delegateAddress: "tz1baker",
      availableBalance: new BigNumber(100_000_000),
    });

    render(<Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />);

    expect(screen.getByText("Acme Baker")).toBeInTheDocument();
    expect(screen.queryByText(/^Staking$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Unstaking$/)).not.toBeInTheDocument();
  });

  it("composes Delegation + Staking sections together in real DOM when flag on and isStaked", () => {
    mockedUseTezosStakingInfo.mockReturnValue({
      ...defaultStakingInfo,
      isDelegated: true,
      isStaked: true,
      delegation: delegationFixture(),
      delegateAddress: "tz1baker",
      availableBalance: new BigNumber(100_000_000),
      stakedBalance: new BigNumber(50_000_000),
    });

    render(<Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />, {
      initialState: stakingOn,
    });

    expect(screen.getByText(/^Staking$/)).toBeInTheDocument();
    expect(screen.getByText(/50\s*XTZ/)).toBeInTheDocument();
    expect(screen.queryByText(/^Unstaking$/)).not.toBeInTheDocument();
    expect(screen.getAllByText("Acme Baker").length).toBeGreaterThanOrEqual(2);
  });

  it("composes Delegation + Unstaking sections with countdown copy when hasUnstaking", () => {
    mockedUseTezosStakingInfo.mockReturnValue({
      ...defaultStakingInfo,
      isDelegated: true,
      hasUnstaking: true,
      delegation: delegationFixture(),
      delegateAddress: "tz1baker",
      availableBalance: new BigNumber(100_000_000),
      unstakedBalance: new BigNumber(20_000_000),
      unstakingPositions: [createMockUnstakingPosition("a", 20_000_000, 24)],
    });

    render(<Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />, {
      initialState: stakingOn,
    });

    expect(screen.getByText(/^Unstaking$/)).toBeInTheDocument();
    expect(screen.getByText(/in 3 days/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Staking$/)).not.toBeInTheDocument();
  });

  it("renders all three sections (Delegation + Staking + Unstaking) together with their data", () => {
    mockedUseTezosStakingInfo.mockReturnValue({
      ...defaultStakingInfo,
      isDelegated: true,
      isStaked: true,
      hasUnstaking: true,
      delegation: delegationFixture(),
      delegateAddress: "tz1baker",
      availableBalance: new BigNumber(100_000_000),
      stakedBalance: new BigNumber(50_000_000),
      unstakedBalance: new BigNumber(20_000_000),
      unstakingPositions: [
        createMockUnstakingPosition("a", 20_000_000, 24),
        createMockUnstakingPosition("b", 10_000_000, 50),
      ],
    });

    render(<Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />, {
      initialState: stakingOn,
    });

    expect(screen.getByText(/^Staking$/)).toBeInTheDocument();
    expect(screen.getByText(/^Unstaking$/)).toBeInTheDocument();
    expect(screen.getByText(/50\s*XTZ/)).toBeInTheDocument();
    expect(screen.getByText(/in 3 days/i)).toBeInTheDocument();
    expect(screen.getByText(/in 2 days/i)).toBeInTheDocument();
    expect(screen.getAllByText("Acme Baker").length).toBeGreaterThanOrEqual(4);
  });

  it("renders 'Processing' for a finalizable position even when other positions still count down", () => {
    mockedIsFinalizable.mockImplementation(uid => uid === "unstake-final");
    mockedUseTezosStakingInfo.mockReturnValue({
      ...defaultStakingInfo,
      isDelegated: true,
      hasUnstaking: true,
      delegation: delegationFixture(),
      delegateAddress: "tz1baker",
      unstakedBalance: new BigNumber(30_000_000),
      unstakedFinalizable: new BigNumber(10_000_000),
      unstakingPositions: [
        createMockUnstakingPosition("final", 10_000_000, 24),
        createMockUnstakingPosition("pending", 20_000_000, 24),
      ],
    });

    render(<Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />, {
      initialState: stakingOn,
    });

    expect(screen.getByText(/Processing/i)).toBeInTheDocument();
    expect(screen.getByText(/in 3 days/i)).toBeInTheDocument();
  });

  it("flag off hides Staking + Unstaking even when isStaked and hasUnstaking are true", () => {
    mockedUseTezosStakingInfo.mockReturnValue({
      ...defaultStakingInfo,
      isDelegated: true,
      isStaked: true,
      hasUnstaking: true,
      delegation: delegationFixture(),
      delegateAddress: "tz1baker",
      stakedBalance: new BigNumber(50_000_000),
      unstakedBalance: new BigNumber(20_000_000),
      unstakingPositions: [createMockUnstakingPosition("a", 20_000_000, 24)],
    });

    render(<Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />);

    expect(screen.getByText("Acme Baker")).toBeInTheDocument();
    expect(screen.queryByText(/^Staking$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Unstaking$/)).not.toBeInTheDocument();
  });

  it("Earn CTA dispatches MODAL_TEZOS_EARNING_CHOICE when flag on and not yet staked", async () => {
    jest.useRealTimers();
    const { user, store } = render(
      <Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />,
      { initialState: stakingOn },
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /earn rewards/i }));
    });

    expect(store.getState().modals.MODAL_TEZOS_EARNING_CHOICE?.isOpened).toBe(true);
    expect(store.getState().modals.MODAL_DELEGATE?.isOpened).toBeFalsy();
  });

  it("Earn CTA falls back to MODAL_DELEGATE when flag is off", async () => {
    jest.useRealTimers();
    const { user, store } = render(
      <Delegation account={createMockAccount("tezos-dashboard")} parentAccount={null} />,
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /earn rewards/i }));
    });

    expect(store.getState().modals.MODAL_DELEGATE?.isOpened).toBe(true);
    expect(store.getState().modals.MODAL_TEZOS_EARNING_CHOICE?.isOpened).toBeFalsy();
  });
});
