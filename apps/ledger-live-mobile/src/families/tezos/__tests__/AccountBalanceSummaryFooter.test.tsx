import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import type { TezosAccount } from "@ledgerhq/live-common/families/tezos/types";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";

let mockFeatureEnabled = false;
let mockInfo: ReturnType<typeof makeInfo>;

const makeInfo = (over: Partial<Record<string, unknown>> = {}) => ({
  isDelegated: false,
  isStaked: false,
  hasUnstaking: false,
  stakedBalance: new BigNumber(0),
  unstakedBalance: new BigNumber(0),
  unstakedFinalizable: new BigNumber(0),
  availableBalance: new BigNumber(0),
  ...over,
});

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/featureFlags/index"),
  useFeature: () => ({ enabled: mockFeatureEnabled }),
}));

jest.mock("@ledgerhq/live-common/families/tezos/react", () => ({
  useTezosStakingInfo: () => mockInfo,
}));

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ code: "XTZ", name: "Tezos", magnitude: 6 }),
}));

jest.mock("~/components/BalanceSummaryInfoItem", () => {
  const ReactMod = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ title }: { title: string }) => ReactMod.createElement(Text, null, title),
  };
});

jest.mock("~/modals/Info", () => ({ __esModule: true, default: () => null }));

const account = {
  type: "Account",
  balance: new BigNumber(1_000_000),
  spendableBalance: new BigNumber(800_000),
  currency: { id: "tezos", ticker: "XTZ" },
} as unknown as TezosAccount;

const titles = {
  available: "account.availableBalance",
  delegated: "account.delegatedAssets",
  staked: "tezos.account.stakedAssets",
  pending: "tezos.account.pendingWithdrawable",
  withdrawable: "tezos.account.withdrawableAssets",
};

beforeEach(() => {
  mockFeatureEnabled = false;
  mockInfo = makeInfo();
});

describe("Tezos AccountBalanceSummaryFooter", () => {
  it("renders nothing for a token account", () => {
    const tokenAccount = {
      type: "TokenAccount",
      balance: new BigNumber(10),
    } as unknown as TezosAccount;
    render(<AccountBalanceSummaryFooter account={tokenAccount} />);
    expect(screen.queryByText(titles.available)).toBeNull();
  });

  it("renders nothing when the balance is zero", () => {
    const zero = { ...account, balance: new BigNumber(0) } as unknown as TezosAccount;
    render(<AccountBalanceSummaryFooter account={zero} />);
    expect(screen.queryByText(titles.available)).toBeNull();
  });

  it("flag off, not delegated: shows only Available balance", () => {
    render(<AccountBalanceSummaryFooter account={account} />);
    expect(screen.getByText(titles.available)).toBeTruthy();
    expect(screen.queryByText(titles.delegated)).toBeNull();
    expect(screen.queryByText(titles.staked)).toBeNull();
    expect(screen.queryByText(titles.pending)).toBeNull();
    expect(screen.queryByText(titles.withdrawable)).toBeNull();
  });

  it("flag off, delegated: shows Available + Delegated only", () => {
    mockInfo = makeInfo({ isDelegated: true });
    render(<AccountBalanceSummaryFooter account={account} />);
    expect(screen.getByText(titles.available)).toBeTruthy();
    expect(screen.getByText(titles.delegated)).toBeTruthy();
    expect(screen.queryByText(titles.staked)).toBeNull();
    expect(screen.queryByText(titles.pending)).toBeNull();
    expect(screen.queryByText(titles.withdrawable)).toBeNull();
  });

  it("flag on, isStaked: shows the Staked row", () => {
    mockFeatureEnabled = true;
    mockInfo = makeInfo({ isStaked: true, stakedBalance: new BigNumber(500) });
    render(<AccountBalanceSummaryFooter account={account} />);
    expect(screen.getByText(titles.staked)).toBeTruthy();
  });

  it("flag on, unstaked balance > 0: shows the Pending withdrawable row", () => {
    mockFeatureEnabled = true;
    mockInfo = makeInfo({ unstakedBalance: new BigNumber(300) });
    render(<AccountBalanceSummaryFooter account={account} />);
    expect(screen.getByText(titles.pending)).toBeTruthy();
  });

  it("flag on, finalizable > 0: shows the Withdrawable assets row", () => {
    mockFeatureEnabled = true;
    mockInfo = makeInfo({ unstakedFinalizable: new BigNumber(200) });
    render(<AccountBalanceSummaryFooter account={account} />);
    expect(screen.getByText(titles.withdrawable)).toBeTruthy();
  });

  it("flag on, fully active: shows all five rows", () => {
    mockFeatureEnabled = true;
    mockInfo = makeInfo({
      isDelegated: true,
      isStaked: true,
      stakedBalance: new BigNumber(500),
      unstakedBalance: new BigNumber(300),
      unstakedFinalizable: new BigNumber(200),
    });
    render(<AccountBalanceSummaryFooter account={account} />);
    expect(screen.getByText(titles.available)).toBeTruthy();
    expect(screen.getByText(titles.delegated)).toBeTruthy();
    expect(screen.getByText(titles.staked)).toBeTruthy();
    expect(screen.getByText(titles.pending)).toBeTruthy();
    expect(screen.getByText(titles.withdrawable)).toBeTruthy();
  });

  it("flag on but no staking activity and not delegated: shows only Available", () => {
    mockFeatureEnabled = true;
    mockInfo = makeInfo();
    render(<AccountBalanceSummaryFooter account={account} />);
    expect(screen.getByText(titles.available)).toBeTruthy();
    expect(screen.queryByText(titles.staked)).toBeNull();
    expect(screen.queryByText(titles.pending)).toBeNull();
    expect(screen.queryByText(titles.withdrawable)).toBeNull();
  });

  it("flag off ignores staking activity: staked balance present but flag disabled hides Staked", () => {
    mockFeatureEnabled = false;
    mockInfo = makeInfo({ isStaked: true, stakedBalance: new BigNumber(500), isDelegated: true });
    render(<AccountBalanceSummaryFooter account={account} />);
    expect(screen.getByText(titles.delegated)).toBeTruthy();
    expect(screen.queryByText(titles.staked)).toBeNull();
  });
});
