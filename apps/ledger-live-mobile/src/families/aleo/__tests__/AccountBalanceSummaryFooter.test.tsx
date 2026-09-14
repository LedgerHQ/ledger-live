import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, act, fireEvent } from "@tests/test-renderer";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import type { AleoAccount, AleoResources } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";

jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

jest.mock(
  "@ledgerhq/coin-aleo/logic",
  () => ({
    getValidators: jest.fn().mockResolvedValue([]),
    isDelegatorBelowMinimum: () => false,
  }),
  { virtual: true },
);

const mockGetCurrencyConfiguration = jest.mocked(getCurrencyConfiguration);

const baseAleoResources: AleoResources = {
  transparentBalance: new BigNumber(0),
  provableApi: null,
  privateBalance: null,
  unspentPrivateRecords: null,
  lastPrivateSyncDate: null,
};

function makeAccount(resources: Partial<AleoResources> = {}): AleoAccount {
  return {
    ...(ALEO_ACCOUNT_1 as AleoAccount),
    blockHeight: 5000,
    pendingOperations: [],
    aleoResources: { ...baseAleoResources, ...resources },
  };
}

function makeConfig(enableStaking: boolean): ReturnType<typeof getCurrencyConfiguration> {
  return {
    status: { type: "active" },
    networkType: "mainnet",
    enableStaking,
  } as ReturnType<typeof getCurrencyConfiguration>;
}

describe("Aleo AccountBalanceSummaryFooter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrencyConfiguration.mockReturnValue(makeConfig(true));
  });

  it("renders nothing when staking is disabled in the currency config", () => {
    mockGetCurrencyConfiguration.mockReturnValue(makeConfig(false));

    const { toJSON } = render(
      <AccountBalanceSummaryFooter account={makeAccount({ bondedBalance: new BigNumber(1) })} />,
    );

    expect(toJSON()).toBeNull();
  });

  it("renders nothing when there is no position", () => {
    const { toJSON } = render(<AccountBalanceSummaryFooter account={makeAccount()} />);

    expect(toJSON()).toBeNull();
  });

  // The account screen drops the "Earn" section on a null return, so an empty position has to
  // produce null from the call itself, not from the element it would render.
  it("returns null itself when there is no position", () => {
    expect(AccountBalanceSummaryFooter({ account: makeAccount() })).toBeNull();
    expect(
      AccountBalanceSummaryFooter({ account: makeAccount({ bondedBalance: new BigNumber(0) }) }),
    ).toBeNull();
  });

  it("splits the position into staked, unstaking and claimable", async () => {
    render(
      <AccountBalanceSummaryFooter
        account={makeAccount({
          bondedBalance: new BigNumber(20_000_000_000),
          unbondingBalance: new BigNumber(5_000_000),
          unbondingHeight: 10_000,
        })}
      />,
    );

    expect(screen.getByText("20,000 ALEO")).toBeOnTheScreen();
    expect(screen.getAllByText("5 ALEO")).toHaveLength(1);
    expect(screen.getByText("0 ALEO")).toBeOnTheScreen();
    await act(async () => {});
  });

  it("counts an elapsed unbonding as claimable rather than unstaking", async () => {
    const account = makeAccount({
      unbondingBalance: new BigNumber(5_000_000),
      unbondingHeight: 4_000,
    });

    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText("Claimable")).toBeOnTheScreen();
    expect(screen.getByText("5 ALEO")).toBeOnTheScreen();
    await act(async () => {});
  });

  it("explains each figure through its info modal", async () => {
    render(
      <AccountBalanceSummaryFooter
        account={makeAccount({ bondedBalance: new BigNumber(20_000_000_000) })}
      />,
    );

    fireEvent.press(screen.getByText("Staked"));

    expect(
      await screen.findByText(
        "The amount currently bonded to a validator. It earns rewards but cannot be spent until you unstake it and the unbonding period ends.",
      ),
    ).toBeOnTheScreen();
  });
});
