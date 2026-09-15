import * as currencies from "@ledgerhq/live-common/currencies/index";
import type { TokenAccount } from "@ledgerhq/types-live";
import React from "react";
import { render, screen } from "tests/testSetup";
import { makeICPAccount, makeNeuron } from "./testUtils";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
}));

jest.mock("~/renderer/hooks/useAccountUnit");

import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";

const STAKED_E8S = 300_000_000n;
const MATURITY_E8S = 50_000_000n;

beforeEach(() => {
  jest.spyOn(currencies, "formatCurrencyUnit").mockImplementation((_unit, value) => {
    if (!value) return "";
    if (value.eq(STAKED_E8S.toString())) return "staked:3.0";
    if (value.eq(MATURITY_E8S.toString())) return "maturity:0.5";
    return value.toString();
  });
});

describe("AccountBalanceSummaryFooter (internet_computer)", () => {
  it("renders nothing for a TokenAccount", () => {
    const tokenAccount = { type: "TokenAccount", id: "stub" } as unknown as TokenAccount;
    const { container } = render(<AccountBalanceSummaryFooter account={tokenAccount} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the account has no neurons", () => {
    const { container } = render(<AccountBalanceSummaryFooter account={makeICPAccount()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders staked balance and total maturity when neurons exist", () => {
    const account = makeICPAccount({
      neurons: [
        makeNeuron({
          cachedNeuronStakeE8s: STAKED_E8S,
          maturityE8sEquivalent: MATURITY_E8S,
        }),
      ],
    });
    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText("Staked Balance")).toBeInTheDocument();
    expect(screen.getByText("staked:3.0")).toBeInTheDocument();
    expect(screen.getByText("Total Maturity")).toBeInTheDocument();
    expect(screen.getByText("maturity:0.5")).toBeInTheDocument();
  });

  it("subtracts neuron fees from the staked balance and aggregates across neurons", () => {
    const account = makeICPAccount({
      neurons: [
        makeNeuron({ id: 1n, cachedNeuronStakeE8s: 200_000_000n, neuronFeesE8s: 50_000_000n }),
        makeNeuron({
          id: 2n,
          cachedNeuronStakeE8s: 150_000_000n,
          maturityE8sEquivalent: 50_000_000n,
        }),
      ],
    });
    render(<AccountBalanceSummaryFooter account={account} />);

    // (200_000_000 - 50_000_000) + 150_000_000
    expect(screen.getByText("staked:3.0")).toBeInTheDocument();
    expect(screen.getByText("maturity:0.5")).toBeInTheDocument();
  });

  it("still renders when only maturity is non-zero", () => {
    const account = makeICPAccount({
      neurons: [makeNeuron({ maturityE8sEquivalent: MATURITY_E8S })],
    });
    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText("Total Maturity")).toBeInTheDocument();
    expect(screen.getByText("maturity:0.5")).toBeInTheDocument();
  });

  // The tooltip promises "both staked and liquid maturity". Staked maturity is excluded from
  // neuronStake as well, so summing only the liquid half left it showing nowhere at all.
  it("counts staked maturity toward the total alongside the liquid part", () => {
    const account = makeICPAccount({
      neurons: [
        makeNeuron({
          maturityE8sEquivalent: MATURITY_E8S / 2n,
          stakedMaturityE8sEquivalent: MATURITY_E8S / 2n,
        }),
      ],
    });
    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText("maturity:0.5")).toBeInTheDocument();
  });

  // With only the liquid half summed, both totals read zero here and the whole footer disappeared.
  it("still renders when a neuron's maturity has all been staked", () => {
    const account = makeICPAccount({
      neurons: [makeNeuron({ stakedMaturityE8sEquivalent: MATURITY_E8S })],
    });
    render(<AccountBalanceSummaryFooter account={account} />);

    expect(screen.getByText("maturity:0.5")).toBeInTheDocument();
  });
});
