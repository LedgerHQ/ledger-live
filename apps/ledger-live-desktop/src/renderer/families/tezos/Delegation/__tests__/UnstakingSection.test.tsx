import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, render, screen } from "tests/testSetup";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type { StakingPosition, TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import { useBaker } from "@ledgerhq/live-common/families/tezos/react";
import type { TezosStakingInfo } from "@ledgerhq/live-common/families/tezos/react";
import { openURL } from "~/renderer/linking";
import { disableGlobalTab, enableGlobalTab } from "~/config/global-tab";
import UnstakingSection from "../UnstakingSection";

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/tezos/react"),
  useBaker: jest.fn(),
}));

jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));

const currency = getCryptoCurrencyById("tezos");
const account = { ...genAccount("tezos-unstake-section", { currency }) } as unknown as TezosAccount;

const mockedUseBaker = jest.mocked(useBaker);

const MOCK_NOW = new Date("2030-01-01T00:00:00Z").getTime();
const DAY = 24 * 60 * 60 * 1000;

const makePending = (
  id: string,
  amount: number,
  hoursAgo: number,
  delegate = "tz1baker",
): StakingPosition =>
  ({
    uid: `unstaking-${id}`,
    address: "tz1self",
    delegate,
    state: "deactivating",
    asset: { type: "native" },
    amount: new BigNumber(amount),
    createdAt: new Date(MOCK_NOW - hoursAgo * 60 * 60 * 1000),
  }) as never;

const makeFinalizable = (id: string, amount: number, delegate = "tz1baker"): StakingPosition =>
  ({
    uid: `finalizable-${id}`,
    address: "tz1self",
    delegate,
    state: "inactive",
    asset: { type: "native" },
    amount: new BigNumber(amount),
    createdAt: new Date(MOCK_NOW - 5 * DAY),
  }) as never;

const makeInfo = (positions: StakingPosition[]): TezosStakingInfo => ({
  isDelegated: true,
  isStaked: false,
  hasUnstaking: positions.length > 0,
  delegation: null,
  stakedBalance: new BigNumber(0),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(0),
  delegateAddress: "tz1baker",
  unstakingPositions: positions,
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(MOCK_NOW);
  mockedUseBaker.mockReturnValue({ address: "tz1baker", name: "Acme Baker" } as never);
});

afterEach(() => {
  jest.useRealTimers();
  disableGlobalTab();
});

describe("Delegation/UnstakingSection (tezos)", () => {
  it("renders nothing when there are no unstaking positions", () => {
    const { container } = render(<UnstakingSection account={account} info={makeInfo([])} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a row per pending position with a relative countdown from createdAt + 4d", () => {
    const info = makeInfo([
      makePending("1", 50_000_000, 24), // 1d elapsed → 72h remaining → "in 3 days"
      makePending("2", 10_000_000, 50), // 50h elapsed → 46h remaining → "in 2 days"
    ]);
    render(<UnstakingSection account={account} info={info} />);
    expect(screen.getByText(/^Unstaking$/)).toBeInTheDocument();
    expect(screen.getByText(/in 3 days/i)).toBeInTheDocument();
    expect(screen.getByText(/in 2 days/i)).toBeInTheDocument();
  });

  it("renders 'Processing' for a finalizable position regardless of elapsed time", () => {
    const info = makeInfo([makeFinalizable("1", 25_000_000)]);
    render(<UnstakingSection account={account} info={info} />);
    expect(screen.getAllByText(/Processing/i).length).toBeGreaterThan(0);
  });

  it("renders 'Processing' for a pending position whose 4-day window has elapsed", () => {
    const info = makeInfo([makePending("1", 25_000_000, 5 * 24)]); // 5 days ago
    render(<UnstakingSection account={account} info={info} />);
    expect(screen.getByText(/Processing/i)).toBeInTheDocument();
  });

  it("renders all unstaking positions in the order provided by the hook", () => {
    const info = makeInfo([
      makePending("a", 10_000_000, 12),
      makePending("b", 20_000_000, 36),
      makeFinalizable("c", 30_000_000),
    ]);
    render(<UnstakingSection account={account} info={info} />);
    const amounts = screen.getAllByText(/XTZ/i);
    expect(amounts).toHaveLength(3);
  });

  it("renders a dash placeholder when createdAt is missing", () => {
    const positionWithoutCreatedAt = {
      uid: "unstaking-x",
      address: "tz1self",
      delegate: "tz1baker",
      state: "deactivating",
      asset: { type: "native" },
      amount: new BigNumber(10_000_000),
    } as never;
    const info = makeInfo([positionWithoutCreatedAt]);
    render(<UnstakingSection account={account} info={info} />);
    expect(screen.getAllByText("—")).toHaveLength(2);
    expect(screen.queryByText(/Processing/i)).not.toBeInTheDocument();
  });

  it("renders a dash for the tx id when no unstake operation matches", () => {
    const accountWithoutOps = { ...account, operations: [] } as unknown as TezosAccount;
    const info = makeInfo([makePending("1", 50_000_000, 24)]);
    render(<UnstakingSection account={accountWithoutOps} info={info} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText(/in 3 days/i)).toBeInTheDocument();
  });

  it("opens the baker URL on baker-cell click", async () => {
    jest.useRealTimers(); // user-event requires real timers
    const info = makeInfo([makePending("1", 10_000_000, 24)]);
    const { user } = render(<UnstakingSection account={account} info={info} />);
    await user.click(screen.getByText(/Acme Baker/i));
    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining("tz1baker"));
  });

  it("shows and links the unstake op tx id when a matching operation exists", async () => {
    jest.useRealTimers(); // user-event requires real timers
    const createdAt = new Date(MOCK_NOW - 24 * 60 * 60 * 1000);
    const hash = "ooYzaV6d1VTZdogvxLdZ7smPGBBPFpktCJMJeYp74givEBhZmAF";
    const accountWithOp = {
      ...account,
      operations: [{ type: "UNSTAKE", date: createdAt, hash }],
    } as unknown as TezosAccount;
    const info = makeInfo([makePending("1", 50_000_000, 24)]);
    const { user } = render(<UnstakingSection account={accountWithOp} info={info} />);

    const link = screen.getByText(shortAddressPreview(hash));
    await user.click(link);
    expect(openURL).toHaveBeenCalledWith(expect.stringContaining(hash));
  });

  it("activates the tx id link via keyboard (Enter) when focused", () => {
    enableGlobalTab(); // focus state + Enter activation are gated on the global-tab flag
    const createdAt = new Date(MOCK_NOW - 24 * 60 * 60 * 1000);
    const hash = "ooYzaV6d1VTZdogvxLdZ7smPGBBPFpktCJMJeYp74givEBhZmAF";
    const accountWithOp = {
      ...account,
      operations: [{ type: "UNSTAKE", date: createdAt, hash }],
    } as unknown as TezosAccount;
    const info = makeInfo([makePending("1", 50_000_000, 24)]);
    render(<UnstakingSection account={accountWithOp} info={info} />);

    const tabbable = screen.getByText(shortAddressPreview(hash)).closest('[tabindex="0"]');
    expect(tabbable).not.toBeNull();
    fireEvent.focus(tabbable as Element);
    fireEvent.keyDown(tabbable as Element, { key: "Enter" });

    expect(openURL).toHaveBeenCalledWith(expect.stringContaining(hash));
  });
});
