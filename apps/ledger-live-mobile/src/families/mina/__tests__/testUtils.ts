import BigNumber from "bignumber.js";
import type {
  MinaAccount,
  Transaction,
  MinaOperation,
} from "@ledgerhq/live-common/families/mina/types";
import type { ValidatorInfo } from "@ledgerhq/live-common/families/mina/types";

export const mockValidators: ValidatorInfo[] = [
  {
    address: "B62qiburnzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzmp7r7UN6X",
    validatorLogo: undefined,
    identityName: "Validator Alpha",
    description: "Alpha validator",
    website: "https://alpha.example.com",
    stake: 5000000,
    delegations: 100,
    blocksCreated: 500,
    name: "Validator Alpha",
    fee: 5,
    delegatorsCount: 100,
  },
  {
    address: "B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWTnFi4WP4LQjGvpfREEYoL",
    validatorLogo: undefined,
    identityName: "Validator Beta",
    description: "Beta validator",
    website: "https://beta.example.com",
    stake: 3000000,
    delegations: 80,
    blocksCreated: 300,
    name: "Validator Beta",
    fee: 10,
    delegatorsCount: 80,
  },
  {
    address: "B62qrQKS9ghd91shs73CBqZBBKJDpSkchQf4tFEuiVkJh8dRzm1rBK",
    validatorLogo: undefined,
    identityName: "Validator Gamma",
    description: "Gamma validator",
    website: "https://gamma.example.com",
    stake: 1000000,
    delegations: 50,
    blocksCreated: 100,
    name: "Validator Gamma",
    fee: 8,
    delegatorsCount: 50,
  },
];

export function createMockMinaAccount(overrides: Partial<MinaAccount> = {}): MinaAccount {
  return {
    type: "Account",
    id: "js:2:mina:B62qtest:mina",
    seedIdentifier: "B62qtest",
    derivationMode: "" as const,
    index: 0,
    freshAddress: "B62qtest",
    freshAddressPath: "44'/12586'/0'/0/0",
    used: true,
    balance: new BigNumber("10000000000"),
    spendableBalance: new BigNumber("10000000000"),
    blockHeight: 100,
    currency: {
      type: "CryptoCurrency",
      id: "mina",
      coinType: 12586,
      name: "Mina",
      managerAppName: "Mina",
      ticker: "MINA",
      scheme: "mina",
      color: "#E39844",
      family: "mina",
      units: [
        { name: "MINA", code: "MINA", magnitude: 9 },
        { name: "nanoMINA", code: "nanoMINA", magnitude: 0 },
      ],
      explorerViews: [],
    },
    feesCurrency: undefined,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2024-01-01"),
    creationDate: new Date("2024-01-01"),
    subAccounts: [],
    swapHistory: [],
    balanceHistoryCache: {
      HOUR: { balances: [], latestDate: null },
      DAY: { balances: [], latestDate: null },
      WEEK: { balances: [], latestDate: null },
    },
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
    },
    ...overrides,
  } as MinaAccount;
}

export function createDelegatingMinaAccount(
  validator: ValidatorInfo = mockValidators[0],
  overrides: Partial<MinaAccount> = {},
): MinaAccount {
  return createMockMinaAccount({
    resources: {
      blockProducers: mockValidators,
      stakingActive: true,
      delegateInfo: validator,
      epochInfo: {
        epoch: "50",
        slot: "100",
        globalSlot: "5000",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-15T00:00:00Z",
      },
    },
    ...overrides,
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
    ...overrides,
  } as Transaction;
}

export function createMockOperation(overrides: Partial<MinaOperation> = {}): MinaOperation {
  return {
    id: "mina-op-1",
    hash: "CkpTestHash123",
    type: "DELEGATE",
    value: new BigNumber("10000000000"),
    fee: new BigNumber("10000000"),
    senders: ["B62qtest"],
    recipients: [mockValidators[0].address],
    blockHeight: 100,
    blockHash: "block-hash-1",
    accountId: "js:2:mina:B62qtest:mina",
    date: new Date("2024-01-01"),
    extra: {
      memo: undefined,
      accountCreationFee: "0",
    },
    ...overrides,
  } as MinaOperation;
}
