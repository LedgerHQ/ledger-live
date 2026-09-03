import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { Operation, OperationType } from "@ledgerhq/types-live";
import Unstakings from "./Unstakings";
import type { AleoStakingPosition } from "./useStakingPosition";
import { useAleoLiveBlockHeight } from "../hooks/useAleoLiveBlockHeight";
import { useSyncOnUnbondingComplete } from "../hooks/useSyncOnUnbondingComplete";
import { ALEO_MAIN_ACCOUNT } from "../__mocks__/account.mock";

jest.mock("../hooks/useAleoLiveBlockHeight");
jest.mock("../hooks/useSyncOnUnbondingComplete");

const mockUseAleoLiveBlockHeight = jest.mocked(useAleoLiveBlockHeight);
const mockUseSyncOnUnbondingComplete = jest.mocked(useSyncOnUnbondingComplete);

const UNBONDING_HEIGHT = 1_000;

const pendingOperation = (type: OperationType): Operation =>
  ({
    id: `pending-${type}`,
    hash: "",
    type,
    value: new BigNumber(1),
    fee: new BigNumber(1),
    senders: [],
    recipients: [],
    accountId: ALEO_MAIN_ACCOUNT.id,
    date: new Date(),
    blockHash: null,
    blockHeight: null,
    extra: {},
  }) as unknown as Operation;

const account = (
  pendingOperations: Operation[] = [],
  // Defaults past the unbonding height, so the synced state already says claimable.
  blockHeight = UNBONDING_HEIGHT + 1,
): AleoAccount => ({
  ...ALEO_MAIN_ACCOUNT,
  blockHeight,
  pendingOperations,
});

const position = (overrides: Partial<AleoStakingPosition> = {}): AleoStakingPosition => ({
  bondedBalance: new BigNumber(0),
  bondedValidator: null,
  validatorLabel: "",
  nonEarningReason: undefined,
  estimatedRate: undefined,
  unbondingBalance: new BigNumber(5_000_000),
  unbondingHeight: UNBONDING_HEIGHT,
  claimableBalance: new BigNumber(5_000_000),
  hasBonded: false,
  hasUnbonding: true,
  hasPendingUnbond: false,
  hasPendingClaim: false,
  hasPendingUnbondingChange: false,
  ...overrides,
});

describe("Unstakings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAleoLiveBlockHeight.mockReturnValue(UNBONDING_HEIGHT + 1);
  });

  it("offers the claim CTA once the funds are claimable", () => {
    render(<Unstakings account={account()} position={position()} />);

    expect(screen.getByTestId("aleo-claim-cta")).toBeInTheDocument();
    expect(screen.queryByTestId("aleo-claim-pending")).not.toBeInTheDocument();
  });

  // The claimable figures come from the `unbonding` mapping, which a broadcast claim has not
  // yet emptied — without the guard the CTA would invite a second claim against funds the
  // chain has already released.
  it("replaces the claim CTA while a claim is pending", () => {
    render(
      <Unstakings
        account={account([pendingOperation("WITHDRAW_UNBONDED")])}
        position={position({ hasPendingClaim: true, hasPendingUnbondingChange: true })}
      />,
    );

    expect(screen.queryByTestId("aleo-claim-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("aleo-claim-pending")).toBeInTheDocument();
  });

  // `unbond_public` rewrites the same single `unbonding` slot the claim would target, so a
  // pending unbond has to close the claim too — guarding claim against only its own op type
  // would leave this crossing open.
  it("withholds the claim CTA while an unbond is pending, and says so", () => {
    render(
      <Unstakings
        account={account([pendingOperation("UNBOND")])}
        position={position({ hasPendingUnbond: true, hasPendingUnbondingChange: true })}
      />,
    );

    expect(screen.queryByTestId("aleo-claim-cta")).not.toBeInTheDocument();
    expect(screen.getByTestId("aleo-unbond-pending")).toBeInTheDocument();
    expect(screen.queryByTestId("aleo-claim-pending")).not.toBeInTheDocument();
  });

  it("keeps the claim CTA when an unrelated operation is pending", () => {
    render(<Unstakings account={account([pendingOperation("OUT")])} position={position()} />);

    expect(screen.getByTestId("aleo-claim-cta")).toBeInTheDocument();
  });

  describe("when the live height has passed the unbonding height but the account has not synced", () => {
    // The bridge validates the claim against `account.blockHeight`, so offering the CTA on the
    // live height alone opens a flow with no amount and a disabled Continue.
    const settling = () =>
      render(
        <Unstakings
          account={account([], UNBONDING_HEIGHT - 10)}
          position={position({ claimableBalance: new BigNumber(0) })}
        />,
      );

    it("withholds the claim CTA and reports that it is settling", () => {
      settling();

      expect(screen.queryByTestId("aleo-claim-cta")).not.toBeInTheDocument();
      expect(screen.getByTestId("aleo-claim-settling")).toBeInTheDocument();
    });

    it("asks for an account sync to close the gap", () => {
      settling();

      expect(mockUseSyncOnUnbondingComplete).toHaveBeenCalledWith(ALEO_MAIN_ACCOUNT.id, true);
    });

    it("does not ask for a sync while the countdown is still running", () => {
      mockUseAleoLiveBlockHeight.mockReturnValue(UNBONDING_HEIGHT - 10);
      render(
        <Unstakings
          account={account([], UNBONDING_HEIGHT - 10)}
          position={position({ claimableBalance: new BigNumber(0) })}
        />,
      );

      expect(mockUseSyncOnUnbondingComplete).toHaveBeenCalledWith(ALEO_MAIN_ACCOUNT.id, false);
      expect(screen.queryByTestId("aleo-claim-settling")).not.toBeInTheDocument();
    });
  });

  describe("remaining wait", () => {
    const countdownAt = (blocksLeft: number) => {
      const height = UNBONDING_HEIGHT - blocksLeft;
      mockUseAleoLiveBlockHeight.mockReturnValue(height);
      render(
        <Unstakings
          account={account([], height)}
          position={position({ claimableBalance: new BigNumber(0) })}
        />,
      );

      return screen.getByTestId("aleo-claim-countdown");
    };

    it("counts the blocks left until the funds unlock", () => {
      expect(countdownAt(240)).toHaveTextContent("~240 blocks left");
    });

    it("keeps the count singular on the last block", () => {
      expect(countdownAt(1)).toHaveTextContent("~1 block left");
    });
  });
});
