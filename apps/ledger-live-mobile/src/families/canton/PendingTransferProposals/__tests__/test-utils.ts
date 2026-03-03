/* eslint-disable @typescript-eslint/consistent-type-assertions, @typescript-eslint/no-explicit-any */
import type { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { ProcessedProposal, RawTransferProposal } from "../types";

export const ACCOUNT_XPUB = "test-xpub";

export const createCantonAccount = (
  overrides: Partial<Account> & Record<string, unknown> = {},
): Account =>
  ({
    type: "Account",
    id: "account-id",
    xpub: ACCOUNT_XPUB,
    currency: {
      type: "CryptoCurrency",
      id: "canton" as any,
      name: "Canton",
      ticker: "CANTON",
      units: [{ code: "CANTON", magnitude: 38, name: "Canton" }],
      managerAppName: "Canton",
      coinType: 60,
      scheme: "canton",
      color: "#000000",
      family: "canton",
      blockAvgTime: 5,
      supportsSegwit: false,
      supportsNativeSegwit: false,
      explorerViews: [],
    },
    balance: new BigNumber("0"),
    spendableBalance: new BigNumber("0"),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    blockHeight: 0,
    freshAddress: "test-address",
    freshAddressPath: "44'/60'/0'/0/0",
    swapHistory: [],
    index: 0,
    derivationMode: "",
    used: false,
    seedIdentifier: "test-seed-identifier",
    creationDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    cantonResources: {
      isOnboarded: true,
      instrumentUtxoCounts: {},
      pendingTransferProposals: [],
      xpub: ACCOUNT_XPUB,
    },
    ...overrides,
  }) as unknown as Account;

export const createRawProposal = (
  contractId: string,
  sender: string,
  receiver: string,
  overrides: Partial<RawTransferProposal> = {},
): RawTransferProposal => ({
  contract_id: contractId,
  sender,
  receiver,
  amount: "1000000",
  instrument_id: "instrument-1",
  instrument_admin: "",
  update_id: "",
  expires_at_micros: Date.now() * 1000 + 3600000000,
  memo: "",
  ...overrides,
});

export const createProcessedProposal = (
  overrides: Partial<ProcessedProposal> = {},
): ProcessedProposal => {
  const futureMicros = (Date.now() + 3600000) * 1000;
  const expiresAt = overrides.expiresAt ?? new Date(futureMicros / 1000);
  const day = new Date(expiresAt);
  day.setHours(0, 0, 0, 0);
  return {
    contractId: "contract-1",
    sender: "sender-xpub",
    receiver: ACCOUNT_XPUB,
    amount: new BigNumber("1000000"),
    instrumentId: "instrument-1",
    memo: "",
    expiresAtMicros: futureMicros,
    isExpired: false,
    isIncoming: true,
    expiresAt,
    day,
    ...overrides,
  };
};

export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  getParent: jest.fn(() => ({ navigate: jest.fn() })),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  getState: jest.fn(),
  getId: jest.fn(),
  getCurrentRoute: jest.fn(),
});

export const createMockRoute = (params: Record<string, unknown> = {}) => ({
  name: "Account",
  key: "Account-key",
  params,
});
