import BigNumber from "bignumber.js";
import { FIGMENT_SUI_VALIDATOR_ADDRESS, ONE_SUI } from "../constants";
import {
  OneSuiMinForStake,
  OneSuiMinForUnstakeToBeLeft,
  SuiStakeNotFound,
  SuiUnstakeExceedsStake,
} from "../errors";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import getTransactionStatus from "./getTransactionStatus";
import prepareTransaction from "./prepareTransaction";

// A gRPC simulation that aborts still yields gas — `simulateTransactionGrpc` reads
// `result.FailedTransaction` on purpose — so fee estimation succeeds even for a transaction the
// chain would reject. Since the build no longer throws either (see `withoutBuildSimulation`),
// `getTransactionStatus` is the only thing left between a sub-minimum stake and the device.
const mockGetFeesForTransaction = jest.fn();
jest.mock("./getFeesForTransaction", () => ({
  __esModule: true,
  default: () => mockGetFeesForTransaction(),
}));

const STAKED_SUI_ID = "0xstake1";

const accountWithStake = (principal: string) =>
  createFixtureAccount({
    suiResources: {
      nonce: 0,
      stakes: [{ stakes: [{ stakedSuiId: STAKED_SUI_ID, principal }] }],
    },
  });

describe("stake guards survive a tolerated simulation failure", () => {
  beforeEach(() => {
    mockGetFeesForTransaction.mockClear();
    mockGetFeesForTransaction.mockResolvedValue({
      fees: BigNumber(3976000),
      gasBudget: BigNumber(ONE_SUI / 10),
    });
  });

  it("reports the minimum-stake error for a sub-minimum delegation", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction({
      mode: "delegate",
      recipient: FIGMENT_SUI_VALIDATOR_ADDRESS,
      amount: BigNumber(ONE_SUI / 2),
    });

    const prepared = await prepareTransaction(account, transaction);
    const status = await getTransactionStatus(account, prepared);

    expect(status.errors.amount).toEqual(new OneSuiMinForStake());
  });

  it("reports the remainder error for a partial unstake leaving under 1 SUI", async () => {
    const account = accountWithStake(String(ONE_SUI));
    const transaction = createFixtureTransaction({
      mode: "undelegate",
      stakedSuiId: STAKED_SUI_ID,
      amount: BigNumber(ONE_SUI / 4),
    });

    const prepared = await prepareTransaction(account, transaction);
    const status = await getTransactionStatus(account, prepared);

    expect(status.errors.amount).toEqual(new OneSuiMinForUnstakeToBeLeft());
  });

  it("reports the overdraw error for an unstake above the position's principal", async () => {
    const account = accountWithStake(String(2 * ONE_SUI));
    const transaction = createFixtureTransaction({
      mode: "undelegate",
      stakedSuiId: STAKED_SUI_ID,
      amount: BigNumber(100000 * ONE_SUI),
    });

    const prepared = await prepareTransaction(account, transaction);
    const status = await getTransactionStatus(account, prepared);

    expect(status.errors.amount).toEqual(new SuiUnstakeExceedsStake());
  });

  it("blocks an unverifiable split when the position is absent from the synced stakes", async () => {
    const account = accountWithStake(String(3 * ONE_SUI));
    const transaction = createFixtureTransaction({
      mode: "undelegate",
      stakedSuiId: "0xnot-synced",
      amount: BigNumber(2 * ONE_SUI),
    });

    const prepared = await prepareTransaction(account, transaction);
    const status = await getTransactionStatus(account, prepared);

    expect(status.errors.amount).toEqual(new SuiStakeNotFound());
  });

  // The parity property itself: preparation must succeed where gRPC used to throw, because the
  // friendly errors above are only reachable once a status object exists.
  it("still produces fees rather than throwing", async () => {
    const account = accountWithStake(String(ONE_SUI));
    const transaction = createFixtureTransaction({
      mode: "undelegate",
      stakedSuiId: STAKED_SUI_ID,
      amount: BigNumber(ONE_SUI / 4),
    });

    await expect(prepareTransaction(account, transaction)).resolves.toMatchObject({
      gasBudget: BigNumber(ONE_SUI / 10),
    });
  });
});
