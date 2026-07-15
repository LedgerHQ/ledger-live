import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
} from "@ledgerhq/errors";
import type { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  fetchTronAccount,
  fetchTronContract,
  getChainParameters,
  getDelegatedResource,
  getTronAccountNetwork,
  getTronSuperRepresentatives,
  triggerConstantContract,
} from "../network";
import { STANDARD_FEES_TRC_20 } from "../logic/constants";
import type { NetworkInfo, Transaction, TronAccount } from "../types";
import {
  TronInvalidFreezeAmount,
  TronInvalidUnDelegateResourceAmount,
  TronNoFrozenForBandwidth,
  TronNoFrozenForEnergy,
  TronNoReward,
  TronNotEnoughEnergy,
  TronNotEnoughTronPower,
  TronNoUnfrozenResource,
  TronUnexpectedFees,
  TronVoteRequired,
} from "../types/errors";
import getTransactionStatus from "./getTransactionStatus";

jest.mock("../network");

const mockFetchTronAccount = jest.mocked(fetchTronAccount);
const mockFetchTronContract = jest.mocked(fetchTronContract);
const mockGetDelegatedResource = jest.mocked(getDelegatedResource);
const mockGetTronSuperRepresentatives = jest.mocked(getTronSuperRepresentatives);
const mockTriggerConstantContract = jest.mocked(triggerConstantContract);
const mockGetChainParameters = jest.mocked(getChainParameters);
const mockGetTronAccountNetwork = jest.mocked(getTronAccountNetwork);

const SENDER_ADDRESS = "TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3";
const RECIPIENT_ADDRESS = "TJRabPrwbZy45sbavfcjinPJC18kjpRTv8";
const TRC20_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const TRC20_SUBACCOUNT_ID = "js:2:tron:sender:+trc20";

const chainParams = {
  energyFee: 210,
  transactionFee: 1000,
  createAccountFee: 100_000,
  createNewAccountFeeInSystemContract: 1_000_000,
};

const buildNetworkInfo = (overrides: Partial<NetworkInfo> = {}): NetworkInfo => ({
  family: "tron",
  freeNetUsed: new BigNumber(0),
  freeNetLimit: new BigNumber(5000),
  netUsed: new BigNumber(0),
  netLimit: new BigNumber(0),
  energyUsed: new BigNumber(0),
  energyLimit: new BigNumber(100_000),
  ...overrides,
});

const createTrc20TokenAccount = (overrides: Partial<TokenAccount> = {}): TokenAccount =>
  ({
    id: TRC20_SUBACCOUNT_ID,
    type: "TokenAccount",
    balance: new BigNumber(1_000_000),
    spendableBalance: new BigNumber(1_000_000),
    operations: [],
    token: {
      id: "tron/trc20/mock",
      contractAddress: TRC20_CONTRACT,
      tokenType: "trc20",
    },
    ...overrides,
  }) as TokenAccount;

const createAccount = (overrides: Partial<TronAccount> = {}): TronAccount =>
  ({
    id: "js:2:tron:sender:",
    type: "Account",
    freshAddress: SENDER_ADDRESS,
    balance: new BigNumber(50_000_000),
    spendableBalance: new BigNumber(50_000_000),
    operations: [],
    subAccounts: [],
    currency: {
      name: "Tron",
      ticker: "TRX",
      units: [{ name: "TRX", code: "TRX", magnitude: 6 }],
    },
    tronResources: {
      frozen: { bandwidth: undefined, energy: undefined },
      unFrozen: { bandwidth: undefined, energy: undefined },
      delegatedFrozen: { bandwidth: undefined, energy: undefined },
      legacyFrozen: { bandwidth: undefined, energy: undefined },
      votes: [],
      tronPower: 0,
      energy: new BigNumber(0),
      bandwidth: {
        freeUsed: new BigNumber(0),
        freeLimit: new BigNumber(0),
        gainedUsed: new BigNumber(0),
        gainedLimit: new BigNumber(0),
      },
      unwithdrawnReward: new BigNumber(0),
      lastWithdrawnRewardDate: undefined,
      lastVotedDate: undefined,
    },
    ...overrides,
  }) as TronAccount;

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  family: "tron",
  mode: "send",
  resource: "BANDWIDTH",
  networkInfo: buildNetworkInfo(),
  duration: null,
  votes: [],
  amount: new BigNumber(1000),
  recipient: RECIPIENT_ADDRESS,
  ...overrides,
});

describe("getTransactionStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchTronAccount.mockResolvedValue([{ address: RECIPIENT_ADDRESS, trc20: [] }]);
    mockFetchTronContract.mockResolvedValue(undefined);
    mockGetDelegatedResource.mockResolvedValue(new BigNumber(0));
    mockGetTronSuperRepresentatives.mockResolvedValue([]);
    mockGetChainParameters.mockResolvedValue(chainParams);
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 0 });
    mockGetTronAccountNetwork.mockResolvedValue(buildNetworkInfo());
  });

  it("sufficient TRC20 fixture: no TronNotEnoughEnergy, fee 0, no fee warning (State A)", async () => {
    const tokenAccount = createTrc20TokenAccount();
    const account = createAccount({ subAccounts: [tokenAccount] });
    const transaction = createTransaction({ subAccountId: tokenAccount.id });
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 1000 });

    const status = await getTransactionStatus(account, transaction);

    expect(status.warnings.amount).toBeUndefined();
    expect(status.estimatedFees.isZero()).toBe(true);
    expect(status.warnings.fee).toBeUndefined();
    expect(status.energyRequired.lte(status.energyAvailable)).toBe(true);
    expect(status.bandwidthRequired.lte(status.bandwidthAvailable)).toBe(true);
  });

  it("does not raise NotEnoughGas when the fee is 0 and the account holds 0 TRX (resources cover it)", async () => {
    const tokenAccount = createTrc20TokenAccount();
    // Zero parent-account TRX balance, but staked energy + free bandwidth cover the transfer.
    const account = createAccount({
      subAccounts: [tokenAccount],
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
    });
    const transaction = createTransaction({ subAccountId: tokenAccount.id });
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 1000 });

    const status = await getTransactionStatus(account, transaction);

    expect(status.estimatedFees.isZero()).toBe(true);
    expect(status.errors.gasLimit).toBeUndefined();
  });

  it("insufficient TRC20 fixture: TronNotEnoughEnergy set, real fee > 0, fee warning set (State B)", async () => {
    const tokenAccount = createTrc20TokenAccount();
    const account = createAccount({ subAccounts: [tokenAccount] });
    const transaction = createTransaction({
      subAccountId: tokenAccount.id,
      networkInfo: buildNetworkInfo({ energyLimit: new BigNumber(500) }),
    });
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 31_895 });

    const status = await getTransactionStatus(account, transaction);

    expect(status.warnings.amount).toBeInstanceOf(TronNotEnoughEnergy);
    expect(status.energyRequired.gt(status.energyAvailable)).toBe(true);
    expect(status.estimatedFees.gt(0)).toBe(true);
    expect(status.warnings.fee).toBeInstanceOf(TronUnexpectedFees);
  });

  it("energyRequired reflects the full simulated energy_used (contract sponsorship percent is not applied)", async () => {
    // Sufficient staked energy here, so despite a large energy_used the transfer is still covered
    // and no TRX is burned — but energyRequired must equal the full simulated figure, not a
    // ratio-scaled fraction of it.
    const tokenAccount = createTrc20TokenAccount();
    const account = createAccount({ subAccounts: [tokenAccount] });
    const transaction = createTransaction({
      subAccountId: tokenAccount.id,
      networkInfo: buildNetworkInfo({ energyLimit: new BigNumber(1_000_000) }),
    });
    mockTriggerConstantContract.mockResolvedValue({ energy_used: 64_285 });

    const status = await getTransactionStatus(account, transaction);

    expect(status.energyRequired).toEqual(new BigNumber(64_285));
    expect(status.warnings.amount).toBeUndefined();
    expect(status.estimatedFees.isZero()).toBe(true);
  });

  it("simulation-failure fixture: does not throw, fee falls back to flat constant, energy reported insufficient", async () => {
    const tokenAccount = createTrc20TokenAccount();
    const account = createAccount({ subAccounts: [tokenAccount] });
    const transaction = createTransaction({ subAccountId: tokenAccount.id });
    mockTriggerConstantContract.mockResolvedValue({
      result: { result: false, code: "REVERT", message: "insufficient balance" },
      energy_used: 0,
    });

    const status = await getTransactionStatus(account, transaction);

    expect(status.energyRequired.gt(status.energyAvailable)).toBe(true);
    expect(status.warnings.amount).toBeInstanceOf(TronNotEnoughEnergy);
    expect(status.estimatedFees).toEqual(STANDARD_FEES_TRC_20);
  });

  it("warning-gate preservation: a native send with low bandwidth does not raise TronNotEnoughEnergy", async () => {
    const account = createAccount();
    const transaction = createTransaction({
      networkInfo: buildNetworkInfo({ freeNetLimit: new BigNumber(0) }),
    });

    const status = await getTransactionStatus(account, transaction);

    expect(status.warnings.amount).toBeUndefined();
    expect(mockTriggerConstantContract).not.toHaveBeenCalled();
  });

  it("no-errors gating: a transaction with a validation error skips the network-backed breakdown entirely", async () => {
    const account = createAccount();
    // recipient === sender triggers InvalidAddressBecauseDestinationIsAlsoSource before any
    // resource breakdown is computed.
    const transaction = createTransaction({ recipient: SENDER_ADDRESS });

    const status = await getTransactionStatus(account, transaction);

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    expect(mockTriggerConstantContract).not.toHaveBeenCalled();
    expect(mockGetChainParameters).not.toHaveBeenCalled();
    expect(status.estimatedFees.isZero()).toBe(true);
    expect(status.energyRequired.isZero()).toBe(true);
    expect(status.energyAvailable.isZero()).toBe(true);
    expect(status.bandwidthRequired.isZero()).toBe(true);
    expect(status.bandwidthAvailable.isZero()).toBe(true);
  });

  it("regression: native TRX send with sufficient bandwidth has estimatedFees 0 and no spurious warnings", async () => {
    const account = createAccount();
    const transaction = createTransaction();

    const status = await getTransactionStatus(account, transaction);

    expect(status.estimatedFees.isZero()).toBe(true);
    expect(status.totalSpent).toEqual(transaction.amount);
    expect(status.warnings.amount).toBeUndefined();
    expect(status.warnings.fee).toBeUndefined();
    expect(status.energyRequired).toEqual(new BigNumber(0));
  });

  it("regression: TRC10 send with sufficient bandwidth has estimatedFees 0 and no energy dimension", async () => {
    const trc10TokenAccount = {
      id: "js:2:tron:sender:+trc10",
      type: "TokenAccount",
      balance: new BigNumber(1_000_000),
      spendableBalance: new BigNumber(1_000_000),
      operations: [],
      token: {
        id: "tron/trc10/1002000",
        contractAddress: "mock-trc10-contract",
        tokenType: "trc10",
      },
    } as unknown as TokenAccount;
    const account = createAccount({ subAccounts: [trc10TokenAccount] });
    const transaction = createTransaction({ subAccountId: trc10TokenAccount.id });

    const status = await getTransactionStatus(account, transaction);

    expect(status.estimatedFees.isZero()).toBe(true);
    expect(status.energyRequired).toEqual(new BigNumber(0));
    expect(status.warnings.amount).toBeUndefined();
    expect(mockTriggerConstantContract).not.toHaveBeenCalled();
  });

  describe("transaction-mode validations", () => {
    it("send with zero amount → AmountRequired", async () => {
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ amount: new BigNumber(0) }),
      );
      expect(status.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("send exceeding the spendable balance → NotEnoughBalance", async () => {
      const status = await getTransactionStatus(
        createAccount({
          balance: new BigNumber(50_000_000),
          spendableBalance: new BigNumber(50_000_000),
        }),
        createTransaction({ amount: new BigNumber(100_000_000) }),
      );
      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("freeze below 1 TRX → TronInvalidFreezeAmount", async () => {
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ mode: "freeze", amount: new BigNumber(1000) }),
      );
      expect(status.errors.amount).toBeInstanceOf(TronInvalidFreezeAmount);
    });

    it("vote with no votes → TronVoteRequired", async () => {
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ mode: "vote", votes: [] }),
      );
      expect(status.errors.vote).toBeInstanceOf(TronVoteRequired);
    });

    it("claimReward with no unwithdrawn reward → TronNoReward", async () => {
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ mode: "claimReward" }),
      );
      expect(status.errors.reward).toBeInstanceOf(TronNoReward);
    });

    it("insufficient parent-account balance for fees → NotEnoughGas", async () => {
      // No free/staked bandwidth → a real native TRX fee is owed that the 0-balance account can't cover.
      const status = await getTransactionStatus(
        createAccount({ balance: new BigNumber(0), spendableBalance: new BigNumber(0) }),
        createTransaction({ networkInfo: buildNetworkInfo({ freeNetLimit: new BigNumber(0) }) }),
      );
      expect(status.estimatedFees.gt(0)).toBe(true);
      expect(status.errors.gasLimit).toBeInstanceOf(NotEnoughGas);
    });

    it("unfreeze BANDWIDTH with nothing frozen → TronNoFrozenForBandwidth", async () => {
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ mode: "unfreeze", resource: "BANDWIDTH", amount: new BigNumber(1000) }),
      );
      expect(status.errors.resource).toBeInstanceOf(TronNoFrozenForBandwidth);
    });

    it("unfreeze ENERGY with nothing frozen → TronNoFrozenForEnergy", async () => {
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ mode: "unfreeze", resource: "ENERGY", amount: new BigNumber(1000) }),
      );
      expect(status.errors.resource).toBeInstanceOf(TronNoFrozenForEnergy);
    });

    it("unDelegateResource beyond the delegated amount → TronInvalidUnDelegateResourceAmount", async () => {
      mockGetDelegatedResource.mockResolvedValue(new BigNumber(0));
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({
          mode: "unDelegateResource",
          resource: "BANDWIDTH",
          amount: new BigNumber(1000),
        }),
      );
      expect(status.errors.resource).toBeInstanceOf(TronInvalidUnDelegateResourceAmount);
    });

    it("vote for an address that is not a super representative → InvalidAddress", async () => {
      mockGetTronSuperRepresentatives.mockResolvedValue([]);
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ mode: "vote", votes: [{ address: RECIPIENT_ADDRESS, voteCount: 1 }] }),
      );
      expect(status.errors.vote).toBeInstanceOf(InvalidAddress);
    });

    it("vote exceeding available Tron Power → TronNotEnoughTronPower", async () => {
      mockGetTronSuperRepresentatives.mockResolvedValue([
        { address: RECIPIENT_ADDRESS },
      ] as unknown as Awaited<ReturnType<typeof getTronSuperRepresentatives>>);
      const status = await getTransactionStatus(
        createAccount({ tronResources: { ...createAccount().tronResources, tronPower: 0 } }),
        createTransaction({ mode: "vote", votes: [{ address: RECIPIENT_ADDRESS, voteCount: 5 }] }),
      );
      expect(status.errors.vote).toBeInstanceOf(TronNotEnoughTronPower);
    });

    it("legacyUnfreeze with nothing legacy-frozen → TronNoFrozenForBandwidth", async () => {
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ mode: "legacyUnfreeze", resource: "BANDWIDTH" }),
      );
      expect(status.errors.resource).toBeInstanceOf(TronNoFrozenForBandwidth);
    });

    it("withdrawExpireUnfreeze with no unfrozen resource → TronNoUnfrozenResource", async () => {
      const status = await getTransactionStatus(
        createAccount(),
        createTransaction({ mode: "withdrawExpireUnfreeze" }),
      );
      expect(status.errors.resource).toBeInstanceOf(TronNoUnfrozenResource);
    });
  });
});
