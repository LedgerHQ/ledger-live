import BigNumber from "bignumber.js";
import { MinaAccount, Transaction, TransactionStatus } from "@ledgerhq/live-common/families/mina/types";
import { ValidatorInfo } from "@ledgerhq/coin-mina/api/types";
import { Operation } from "@ledgerhq/types-live";
import { StepProps } from "../StakingFlowModal/types";

export const mockValidators: ValidatorInfo[] = [
  {
    address: "B62qmQsEHcsPUs5xdtHKjKP1FNR13FMwRWjJATSjE2UrNoMiHHQtRN7",
    validatorLogo: undefined,
    identityName: "Validator Alpha",
    description: "First validator",
    website: "https://alpha.validator",
    stake: 5000000,
    delegations: 100,
    blocksCreated: 500,
    name: "Validator Alpha",
    fee: 5,
    delegatorsCount: 100,
  },
  {
    address: "B62qiburnzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzmp7r7AXkzGC",
    validatorLogo: undefined,
    identityName: "Validator Beta",
    description: "Second validator",
    website: "https://beta.validator",
    stake: 3000000,
    delegations: 80,
    blocksCreated: 300,
    name: "Validator Beta",
    fee: 8,
    delegatorsCount: 80,
  },
  {
    address: "B62qnJHBeVJqWamJDHkPkFsZMjKLHftLGsFyjmjLtZmZiSgtSTCEWPb",
    validatorLogo: undefined,
    identityName: "Validator Gamma",
    description: "Third validator",
    website: undefined,
    stake: 1000000,
    delegations: 50,
    blocksCreated: 100,
    name: "Validator Gamma",
    fee: 10,
    delegatorsCount: 50,
  },
  {
    address: "B62qkBqSkXgkirtU3n8HJ9YgwHh3vUD6kGJ5ZRkQYGNPeL5xYL2tL1L",
    validatorLogo: undefined,
    identityName: "Validator Delta",
    description: "Fourth validator",
    website: undefined,
    stake: 800000,
    delegations: 30,
    blocksCreated: 50,
    name: "Validator Delta",
    fee: 12,
    delegatorsCount: 30,
  },
  {
    address: "B62qpYGEhz7Z6gJbx9Q3JKSRLRdoSBHTFKtoWHHWi6pCjXgMDMEd9HU",
    validatorLogo: undefined,
    identityName: "Validator Epsilon",
    description: "Fifth validator",
    website: undefined,
    stake: 500000,
    delegations: 20,
    blocksCreated: 25,
    name: "Validator Epsilon",
    fee: 15,
    delegatorsCount: 20,
  },
];

export function createMockMinaAccount(
  overrides: Partial<MinaAccount> & { resources?: Partial<MinaAccount["resources"]> } = {},
): MinaAccount {
  const { resources: resourceOverrides, ...rest } = overrides;
  return {
    id: "js:2:mina:B62testaddress:mina",
    type: "Account",
    used: true,
    currency: {
      id: "mina",
      name: "Mina",
      type: "CryptoCurrency",
      family: "mina",
      units: [{ name: "MINA", code: "MINA", magnitude: 9 }],
      ticker: "MINA",
      scheme: "mina",
      color: "#6B49CE",
      managerAppName: "Mina",
      coinType: 12586,
      explorerViews: [],
    },
    derivationMode: "" as const,
    index: 0,
    freshAddress: "B62testaddress",
    freshAddressPath: "44'/12586'/0'/0/0",
    creationDate: new Date("2024-01-01"),
    lastSyncDate: new Date("2024-06-01"),
    balance: new BigNumber("10000000000"),
    spendableBalance: new BigNumber("10000000000"),
    seedIdentifier: "test_seed",
    blockHeight: 100000,
    operationsCount: 5,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    resources: {
      blockProducers: mockValidators,
      stakingActive: false,
      delegateInfo: undefined,
      epochInfo: {
        epoch: "50",
        slot: "100",
        globalSlot: "5000",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-15T00:00:00Z",
      },
      ...resourceOverrides,
    },
    ...rest,
  } as unknown as MinaAccount;
}

export function createDelegatingMinaAccount(
  delegateValidator: ValidatorInfo = mockValidators[0],
): MinaAccount {
  return createMockMinaAccount({
    resources: {
      blockProducers: mockValidators,
      stakingActive: true,
      delegateInfo: delegateValidator,
      epochInfo: {
        epoch: "50",
        slot: "100",
        globalSlot: "5000",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-15T00:00:00Z",
      },
    },
  });
}

export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    family: "mina",
    amount: new BigNumber(0),
    recipient: "",
    fees: {
      fee: new BigNumber("10000000"),
      accountCreationFee: new BigNumber("1000000000"),
    },
    memo: undefined,
    nonce: 0,
    txType: "stake",
    ...overrides,
  } as Transaction;
}

export function createMockTransactionStatus(
  overrides: Partial<TransactionStatus> = {},
): TransactionStatus {
  return {
    errors: {},
    warnings: {},
    estimatedFees: new BigNumber("10000000"),
    amount: new BigNumber(0),
    totalSpent: new BigNumber("10000000"),
    ...overrides,
  } as TransactionStatus;
}

export function createMockOperation(overrides: Partial<Operation> = {}): Operation {
  return {
    id: "mina-op-123",
    hash: "test-hash-123",
    type: "DELEGATE",
    value: new BigNumber("10000000"),
    fee: new BigNumber("10000000"),
    senders: ["B62testaddress"],
    recipients: [mockValidators[0].address],
    blockHeight: 100001,
    blockHash: null,
    accountId: "js:2:mina:B62testaddress:mina",
    date: new Date("2024-06-01"),
    extra: {},
    subOperations: [],
    ...overrides,
  } as unknown as Operation;
}

export function createMockStepProps(overrides: Partial<StepProps> = {}): StepProps {
  return {
    t: ((key: string) => key) as StepProps["t"],
    transitionTo: jest.fn(),
    device: null,
    account: createMockMinaAccount(),
    parentAccount: null,
    onRetry: jest.fn(),
    onClose: jest.fn(),
    openModal: jest.fn() as unknown as StepProps["openModal"],
    optimisticOperation: undefined,
    error: undefined,
    signed: false,
    transaction: createMockTransaction(),
    status: createMockTransactionStatus(),
    onChangeTransaction: jest.fn(),
    onUpdateTransaction: jest.fn(),
    onTransactionError: jest.fn(),
    onOperationBroadcasted: jest.fn(),
    setSigned: jest.fn(),
    bridgePending: false,
    source: "Account Page",
    ...overrides,
  };
}
