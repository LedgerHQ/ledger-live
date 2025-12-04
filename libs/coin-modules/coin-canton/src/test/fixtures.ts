/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import type { CantonAccount, Transaction } from "../types";
import type {
  BlockView,
  FeesView,
  InstrumentBalance,
  OnboardingPrepareResponse,
  OperationStatusView,
  OperationTypeView,
  OperationView,
  PrepareTransferResponse,
  TransferProposal,
  TransferView,
} from "../types/gateway";
import type {
  CantonPreparedTransaction,
  CantonSignature,
  CantonSigner,
  CantonUntypedVersionedMessage,
} from "../types/signer";
import {
  type CantonTestKeyPair,
  createMockSigner as createCantonMockSigner,
  generateMockKeyPair,
} from "./cantonTestUtils";
import prepareTransferMock from "./prepare-transfer.json";

const DEFAULT_VALUES = {
  INSTRUMENT: {
    ADMIN_ID: "AmuletAdmin",
    ID: "Amulet",
  },
  CONFIG: {
    GATEWAY_URL: "https://canton-gateway.api.live.ledger-test.com",
    NETWORK_TYPE: "devnet",
  },
  DERIVATION_PATH: "44'/6767'/0'/0'/0'",
} as const;

let idCounter = 0;
const generateUniqueId = (prefix: string): string => `${prefix}${++idCounter}`;

function createFactory<T>(defaults: T) {
  return (overrides: Partial<T> = {}): T => ({
    ...defaults,
    ...overrides,
  });
}

export const createMockCantonCurrency = (): CryptoCurrency => {
  const mockCurrency = {
    id: "canton_network",
    name: "Canton",
    type: "CryptoCurrency",
    family: "canton",
    units: [{ name: "Canton", code: "CANTON", magnitude: 38 }],
    ticker: "CANTON",
    scheme: "canton",
    color: "#000000",
    managerAppName: "Canton",
    coinType: 6767,
    explorerViews: [],
  } satisfies CryptoCurrency;
  return mockCurrency;
};

export const createMockCantonAccount = (
  overrides: Partial<Account | CantonAccount> = {},
  partialCantonResources?: Partial<CantonAccount["cantonResources"]>,
) => {
  const currency = createMockCantonCurrency();
  const derivationMode = "canton" as const;
  const freshAddressPath = DEFAULT_VALUES.DERIVATION_PATH;

  const cantonResources = {
    publicKey: "",
    instrumentUtxoCounts: {},
    pendingTransferProposals: [],
  };

  const baseAccount = {
    id: `js:2:canton_network:test_address:canton`,
    type: "Account",
    used: true,
    currency,
    derivationMode,
    index: 0,
    freshAddress: "test_address",
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    seedIdentifier: "test_seed",
    blockHeight: 0,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: createEmptyHistoryCache(),
    swapHistory: [],
    subAccounts: [],
    cantonResources,
    ...overrides,
  };

  const cantonResourcesFromOverrides = (overrides as Partial<CantonAccount>).cantonResources;
  if (cantonResourcesFromOverrides || partialCantonResources) {
    return {
      ...baseAccount,
      cantonResources: {
        ...cantonResourcesFromOverrides,
        ...partialCantonResources,
      },
    } as CantonAccount;
  }

  return baseAccount as CantonAccount;
};

export const createMockCantonAccountShapeInfo = <T extends Account = Account>(
  overrides: Partial<AccountShapeInfo<T>> = {},
): AccountShapeInfo<T> => {
  const currency = createMockCantonCurrency();
  return {
    address: "alice::f9e8d7c6b5a4321098765432109876543210fedcba0987654321098765432109876",
    currency,
    derivationMode: "",
    derivationPath: DEFAULT_VALUES.DERIVATION_PATH,
    deviceId: "fakeDevice",
    initialAccount: undefined,
    ...overrides,
  } as AccountShapeInfo<T>;
};

export class MockCantonSigner implements CantonSigner {
  private keyPair: CantonTestKeyPair;
  private mockSigner: ReturnType<typeof createCantonMockSigner>;

  constructor(keyPair?: CantonTestKeyPair) {
    this.keyPair = keyPair || generateMockKeyPair();
    this.mockSigner = createCantonMockSigner(this.keyPair);
  }

  async getAddress(path: string, _display?: boolean) {
    const address = await this.mockSigner.getAddress(path);
    return {
      ...address,
      path,
    };
  }

  async signTransaction(
    path: string,
    data: CantonPreparedTransaction | CantonUntypedVersionedMessage | string,
  ): Promise<CantonSignature> {
    const signatureResult = await this.mockSigner.signTransaction(path, data);

    if (typeof data === "object" && "transactions" in data && typeof data.challenge === "string") {
      const challengeHash = data.challenge.replace(/^0x/, "");
      return {
        signature: signatureResult.signature,
        applicationSignature: this.keyPair.sign(challengeHash),
      };
    }

    return { signature: signatureResult.signature };
  }

  getKeyPair(): CantonTestKeyPair {
    return this.keyPair;
  }
}

export const createMockCantonSigner = (keyPair?: CantonTestKeyPair): MockCantonSigner => {
  return new MockCantonSigner(keyPair);
};

export const createMockSignerContext = (
  signer?: CantonSigner,
  keyPair?: CantonTestKeyPair,
): SignerContext<CantonSigner> => {
  const mockSigner = signer || createMockCantonSigner(keyPair);
  const mockFn = jest.fn(
    async (_deviceId: string, callback: (signer: CantonSigner) => Promise<CantonSignature>) => {
      return callback(mockSigner);
    },
  );
  return mockFn as SignerContext<CantonSigner>;
};

export const createMockCantonSignature = createFactory<CantonSignature>({
  signature: "test-signature",
});

export const createMockTransaction = createFactory<Transaction>({
  family: "canton",
  amount: new BigNumber(100),
  recipient: "bob::a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890",
  fee: new BigNumber(10),
  tokenId: "",
  memo: "",
});

export const createMockPrepareTransferResponse = createFactory<PrepareTransferResponse>({
  hash: "test-hash",
  json: prepareTransferMock,
  serialized: "serialized-transaction",
  step: { type: "single-step" },
});

const createMockOnboardingTransactions = (
  overrides?: Partial<OnboardingPrepareResponse["transactions"]>,
): OnboardingPrepareResponse["transactions"] => ({
  namespace_transaction: {
    serialized: "namespace-transaction-data",
    transaction: {},
    hash: "namespace-hash",
  },
  party_to_key_transaction: {
    serialized: "party-to-key-transaction-data",
    transaction: {},
    hash: "party-to-key-hash",
  },
  party_to_participant_transaction: {
    serialized: "party-to-participant-transaction-data",
    transaction: {},
    hash: "party-to-participant-hash",
  },
  combined_hash: "combined-hash",
  ...overrides,
});

export const createMockOnboardingPrepareResponse = createFactory<OnboardingPrepareResponse>({
  party_id: "test-party-id",
  party_name: "test-party-name",
  public_key_fingerprint: "test-fingerprint",
  transactions: createMockOnboardingTransactions(),
  challenge_nonce: "1234567890abcdef",
  challenge_deadline: 1735689599,
});

export const createMockInstrumentBalance = createFactory<InstrumentBalance>({
  admin_id: DEFAULT_VALUES.INSTRUMENT.ADMIN_ID,
  instrument_id: DEFAULT_VALUES.INSTRUMENT.ID,
  amount: "1000",
  locked: false,
  utxo_count: 1,
});

export const createMockInstrumentBalances = (
  count: number = 1,
  overrides: Partial<InstrumentBalance> | Partial<InstrumentBalance>[] = {},
): InstrumentBalance[] => {
  const overridesArray = Array.isArray(overrides) ? overrides : [overrides];
  return Array.from({ length: count }, (_, index) =>
    createMockInstrumentBalance(overridesArray[index] || overridesArray[0] || {}),
  );
};

export const createMockTransferView = createFactory<TransferView>({
  address: "party456",
  type: "Send",
  value: "100",
  details: {
    metadata: {
      reason: "test transfer",
    },
  },
  asset: DEFAULT_VALUES.INSTRUMENT.ID,
});

const createMockBlockView = createFactory<BlockView>({
  height: 1,
  time: new Date().toISOString(),
  hash: "blockhash1",
});

export const createMockFeesView = createFactory<FeesView>({
  value: "5",
  asset: {
    type: "native",
    instrumentAdmin: DEFAULT_VALUES.INSTRUMENT.ADMIN_ID,
    instrumentId: DEFAULT_VALUES.INSTRUMENT.ID,
  },
  details: {},
});

export const createMockOperationView = (overrides: Partial<OperationView> = {}): OperationView => {
  const transactionHash = overrides.transaction_hash || generateUniqueId("tx");
  return {
    uid: generateUniqueId("uid"),
    transaction_hash: transactionHash,
    transaction_timestamp: new Date().toISOString(),
    status: "Success" as OperationStatusView,
    type: "Send" as OperationTypeView,
    senders: ["test-party-id-1"],
    recipients: ["test-party-id-2"],
    transfers: [createMockTransferView()],
    block: createMockBlockView(),
    fee: createMockFeesView(),
    details: {
      metadata: {
        reason: "test transfer",
      },
    },
    ...overrides,
  };
};

export const setupMockCoinConfig = (overrides: Partial<Record<string, unknown>> = {}): void => {
  coinConfig.setCoinConfig(
    () =>
      ({
        gatewayUrl: DEFAULT_VALUES.CONFIG.GATEWAY_URL,
        useGateway: true,
        networkType: DEFAULT_VALUES.CONFIG.NETWORK_TYPE,
        nativeInstrumentId: DEFAULT_VALUES.INSTRUMENT.ID,
        status: {
          type: "active",
        },
        ...overrides,
      }) as unknown as ReturnType<Parameters<typeof coinConfig.setCoinConfig>[0]>,
  );
};

export const createMockCoinConfigValue = createFactory({
  gatewayUrl: DEFAULT_VALUES.CONFIG.GATEWAY_URL,
  useGateway: true,
  networkType: DEFAULT_VALUES.CONFIG.NETWORK_TYPE,
  nativeInstrumentId: DEFAULT_VALUES.INSTRUMENT.ID,
  minReserve: 100,
  status: { type: "active" },
});

export const createMockPendingTransferProposal = createFactory<TransferProposal>({
  contract_id: "test-contract-id",
  sender: "alice::f9e8d7c6b5a4321098765432109876543210fedcba0987654321098765432109876",
  receiver: "bob::a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890",
  instrument_admin: DEFAULT_VALUES.INSTRUMENT.ADMIN_ID,
  instrument_id: DEFAULT_VALUES.INSTRUMENT.ID,
  amount: "100",
  memo: "test memo",
  expires_at_micros: Date.now() * 1000 + 86400000000, // 1 day from now
  update_id: "test-update-id",
});

export { generateMockKeyPair, type CantonTestKeyPair };
