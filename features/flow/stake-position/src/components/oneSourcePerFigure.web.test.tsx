import React from "react";
import { render, screen } from "@testing-library/react";
import { mockEarnPosition } from "@domain/entity-earn-position/schema.mock";
import { I18nWrapper } from "../__tests__/i18nWrapper";
import { getExitAmount, toChainExit } from "../logic/positionRules";
import {
  getStakePositionValidatorName,
  toStakePositionDetailsProps,
} from "../logic/stakePositionDetails";
import type {
  ReadyStakePositionData,
  StakePositionFormatter,
  StakePositionSnapshot,
} from "../types";
import { StakePositionConfirm } from "./StakePositionConfirm";
import { StakePositionDetails } from "./StakePositionDetails";

const LAMPORTS_PER_SOL = 1_000_000_000n;

const formatSol = (lamports: bigint) => `${lamports / LAMPORTS_PER_SOL} SOL`;

const FORMAT: StakePositionFormatter = {
  amount: lamports => ({ crypto: formatSol(BigInt(lamports)) }),
  rewardsHeadline: () => undefined,
  percent: fraction => `${(fraction * 100).toFixed(2)}%`,
};

const BACKEND_POSITION = mockEarnPosition({
  balance: (10n * LAMPORTS_PER_SOL).toString(),
  totalRewards: undefined,
  deposited: undefined,
});

const READY: ReadyStakePositionData = {
  kind: "ready",
  position: BACKEND_POSITION,
  status: "active",
  validatorApy: undefined,
  isStale: false,
  isPolling: false,
};

const CHAIN_SNAPSHOT: StakePositionSnapshot = {
  state: "active",
  amount: 12n * LAMPORTS_PER_SOL,
  withdrawableAmount: 0n,
  canStake: true,
  canWithdraw: true,
};

describe("one source per figure", () => {
  it("should show the backend balance in the details, never the chain amount", () => {
    render(
      <StakePositionDetails
        ticker="SOL"
        {...toStakePositionDetailsProps(READY, toChainExit(CHAIN_SNAPSHOT, false), FORMAT)}
        onEarnMore={jest.fn()}
        onSelectExitAction={jest.fn()}
      />,
      { wrapper: I18nWrapper },
    );

    expect(screen.getByText("10 SOL")).toBeVisible();
    expect(screen.queryByText("12 SOL")).not.toBeInTheDocument();
  });

  it("should name the chain snapshot figure on the confirmation, never the backend balance", () => {
    render(
      <StakePositionConfirm
        action="deactivate"
        ticker="SOL"
        amount={formatSol(getExitAmount(CHAIN_SNAPSHOT, "deactivate"))}
        validatorName={getStakePositionValidatorName(BACKEND_POSITION)}
        isPending={false}
        isConfirmDisabled={false}
        onConfirm={jest.fn()}
      />,
      { wrapper: I18nWrapper },
    );

    expect(
      screen.getByText(/^Your 12 SOL in Ledger by Figment will be deactivated\./),
    ).toBeVisible();
    expect(screen.queryByText(/10 SOL/)).not.toBeInTheDocument();
  });
});
