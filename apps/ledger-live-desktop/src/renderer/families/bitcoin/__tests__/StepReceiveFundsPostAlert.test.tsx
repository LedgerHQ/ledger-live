import React from "react";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import StepReceiveFundsPostAlert from "../StepReceiveFundsPostAlert";
import type { StepProps } from "~/renderer/modals/Receive/Body";

const makeProps = (currencyId: string, derivationMode = ""): StepProps =>
  ({
    account: {
      ...createFixtureAccount(),
      derivationMode,
      currency: { id: currencyId, family: "bitcoin" },
    },
    parentAccount: null,
  }) as unknown as StepProps;

describe("bitcoin StepReceiveFundsPostAlert", () => {
  it("renders the staking warning for a Dash account", () => {
    render(<StepReceiveFundsPostAlert {...makeProps("dash")} />);
    expect(screen.getByText(/staking rewards/)).toBeInTheDocument();
  });

  it("renders the taproot warning for a taproot account", () => {
    render(<StepReceiveFundsPostAlert {...makeProps("bitcoin", "taproot")} />);
    expect(screen.getByText(/supports taproot/)).toBeInTheDocument();
  });

  it("renders nothing for a native segwit bitcoin account", () => {
    render(<StepReceiveFundsPostAlert {...makeProps("bitcoin", "native_segwit")} />);
    expect(screen.queryByText(/staking rewards|supports taproot/)).not.toBeInTheDocument();
  });
});
