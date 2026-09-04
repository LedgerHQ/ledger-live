import type { ICPNeuron } from "@ledgerhq/live-common/families/internet_computer/types";
import BigNumber from "bignumber.js";
import { render, screen } from "@tests/test-renderer";
import React from "react";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { ICP_UNIT, makeICPAccount, makeNeuron } from "./testUtils";

jest.mock("LLM/hooks/useAccountUnit", () => ({ useAccountUnit: () => ICP_UNIT }));

const ICP = 100_000_000n;

const renderFooter = (neurons: ICPNeuron[]) =>
  render(<AccountBalanceSummaryFooter account={makeICPAccount({ neurons })} />);

describe("AccountBalanceSummaryFooter", () => {
  it("shows nothing when the account has no neurons", () => {
    expect(renderFooter([]).toJSON()).toBeNull();
  });

  it("shows nothing when every neuron is empty, rather than a row of zeroes", () => {
    expect(renderFooter([makeNeuron()]).toJSON()).toBeNull();
  });

  // Every other staking family leads its footer with the available balance (cosmos, tezos, polkadot,
  // celo, near, tron, sui, canton all do), so ICP does too.
  it("leads with the spendable balance", () => {
    render(
      <AccountBalanceSummaryFooter
        account={makeICPAccount({
          neurons: [makeNeuron({ cachedNeuronStakeE8s: ICP })],
          spendableBalance: new BigNumber((4n * ICP).toString()),
        })}
      />,
    );

    expect(screen.getByText("Available balance")).toBeVisible();
    expect(screen.getByText(/^4\b/)).toBeVisible();
  });

  it("reports the staked total net of accrued neuron fees", () => {
    renderFooter([makeNeuron({ cachedNeuronStakeE8s: 3n * ICP, neuronFeesE8s: ICP })]);

    expect(screen.getByText("Staked Balance")).toBeVisible();
    expect(screen.getByText(/^2\b/)).toBeVisible();
  });

  it("sums the stake across every neuron", () => {
    renderFooter([
      makeNeuron({ id: 1n, cachedNeuronStakeE8s: 2n * ICP }),
      makeNeuron({ id: 2n, cachedNeuronStakeE8s: 3n * ICP }),
    ]);

    expect(screen.getByText(/^5\b/)).toBeVisible();
  });

  // Staked maturity is excluded from `neuronStake`, so it appears in neither the staked total nor the
  // liquid maturity. Leaving it out of both would make it invisible while the copy claims otherwise.
  it("counts both liquid and already-staked maturity in the total maturity", () => {
    renderFooter([
      makeNeuron({
        cachedNeuronStakeE8s: ICP,
        maturityE8sEquivalent: 2n * ICP,
        stakedMaturityE8sEquivalent: 3n * ICP,
      }),
    ]);

    expect(screen.getByText("Total Maturity")).toBeVisible();
    expect(screen.getByText(/^5\b/)).toBeVisible();
  });

  it("renders for a main account only, not a token account", () => {
    const tokenAccount = { type: "TokenAccount" } as never;

    expect(render(<AccountBalanceSummaryFooter account={tokenAccount} />).toJSON()).toBeNull();
  });
});
