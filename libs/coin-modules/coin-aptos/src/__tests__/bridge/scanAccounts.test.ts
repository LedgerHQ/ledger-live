import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import network from "@ledgerhq/live-network";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import { lastValueFrom, toArray } from "rxjs";
import { createBridges } from "../../bridge";
import type { AptosSigner } from "../../types";

const mockAptosClient = jest.fn();
jest.mock("@aptos-labs/aptos-client", () => ({
  __esModule: true,
  default: (request: unknown) => mockAptosClient(request),
}));
jest.mock("@ledgerhq/live-network/network");
jest.mock("../../network/validators", () => ({
  getValidators: jest.fn(() => Promise.resolve([])),
}));

const SEED = {
  address: "0x" + "5".repeat(64),
  publicKey: "d6816f4f22f867b56cf9304b776f452a16d107835d73ee8a33c4ced210300583",
};
const ACCOUNTS = [
  {
    address: "0x445fa0013887abd1a0c14acdec6e48090e0ad3fed3e08202aac15ca14f3be26b",
    publicKey: "d1a8c6a1cdd52dd40c7ea61ee4571fb51fcae440a594c1eca18636928f1d3956",
  },
  {
    address: "0x" + "6".repeat(64),
    publicKey: "6a7712fdac0cb4ed27076c707e7798be52cf6c93a2d43d5cf9b874d0a45a111e",
  },
  {
    address: "0x" + "7".repeat(64),
    publicKey: "8ffc0c2e141ead220f05b30fa01ce9a3783c5a157219f922b02ec194308b1b45",
  },
];
const KEYS_BY_PATH: Record<string, { address: string; publicKey: string }> = {
  "44'/637'/0'/0'/0'": ACCOUNTS[0],
  "44'/637'/1'/0'/0'": ACCOUNTS[1],
  "44'/637'/2'/0'/0'": ACCOUNTS[2],
};

const TOKEN = {
  type: "TokenCurrency",
  id: "aptos/coin/dstapt_0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::stakedaptos",
  contractAddress:
    "0xd11107bdf0d6d7040c6c0bfbdecb6545191fdf13e8d8d259952f53e1713f61b5::staked_coin::StakedAptos",
  parentCurrencyId: "aptos",
  name: "dstAPT",
  tokenType: "coin",
  ticker: "dstAPT",
  disableCountervalue: false,
  delisted: false,
  units: [{ name: "dstAPT", code: "dstAPT", magnitude: 8 }],
} as unknown as TokenCurrency;

const FUNDED_ACCOUNT_ID = `js:2:aptos:${ACCOUNTS[0].publicKey}:aptos`;
const TOKEN_ACCOUNT_ID = encodeTokenAccountId(FUNDED_ACCOUNT_ID, TOKEN);

const signer = {
  getAddress: jest.fn(async (path: string) => {
    const keys = KEYS_BY_PATH[path] ?? SEED;
    return { address: keys.address, publicKey: Buffer.from(keys.publicKey, "hex") };
  }),
};

const signerContext = ((_deviceId: string, fn: (signer: unknown) => unknown) =>
  fn(signer)) as unknown as SignerContext<AptosSigner>;

const NATIVE_BALANCES: Record<string, string> = {
  [ACCOUNTS[0].address]: "19949100",
  [ACCOUNTS[1].address]: "5",
};
const TOKEN_BALANCE = "30000000";
const BLOCK_HEIGHT = "302459501";
const NATIVE_TX_VERSION = 100;
const TOKEN_TX_VERSION = 101;
const COIN_STORE_TYPE = `0x1::coin::CoinStore<${TOKEN.contractAddress}>`;
const TOKEN_SENDER_CREATION_NUMBER = "3";

const userTransaction = (version: number, overrides: Record<string, unknown>) => ({
  type: "user_transaction",
  version: String(version),
  hash: `0xhash${version}`,
  success: true,
  sender: ACCOUNTS[0].address,
  sequence_number: String(version),
  gas_used: "10",
  gas_unit_price: "100",
  timestamp: "1741776173570000",
  events: [],
  changes: [],
  ...overrides,
});

const TRANSACTIONS_BY_VERSION: Record<number, unknown> = {
  [NATIVE_TX_VERSION]: userTransaction(NATIVE_TX_VERSION, {
    payload: {
      type: "entry_function_payload",
      function: "0x1::aptos_account::transfer",
      type_arguments: [],
      arguments: [ACCOUNTS[1].address, "1000"],
    },
  }),
  [TOKEN_TX_VERSION]: userTransaction(TOKEN_TX_VERSION, {
    payload: {
      type: "entry_function_payload",
      function: "0x1::aptos_account::transfer_coins",
      type_arguments: [TOKEN.contractAddress],
      arguments: [ACCOUNTS[1].address, "250"],
    },
    events: [
      {
        type: "0x1::coin::WithdrawEvent",
        guid: {
          account_address: ACCOUNTS[0].address,
          creation_number: TOKEN_SENDER_CREATION_NUMBER,
        },
        data: { amount: "250" },
      },
    ],
    changes: [
      {
        type: "write_resource",
        address: ACCOUNTS[0].address,
        data: {
          type: COIN_STORE_TYPE,
          data: {
            withdraw_events: {
              guid: {
                id: { addr: ACCOUNTS[0].address, creation_num: TOKEN_SENDER_CREATION_NUMBER },
              },
            },
            deposit_events: {
              guid: { id: { addr: ACCOUNTS[0].address, creation_num: "4" } },
            },
          },
        },
      },
    ],
  }),
};

const respond = (data: unknown) => ({
  status: 200,
  statusText: "OK",
  data,
  headers: {},
  config: {},
  request: {},
});

type IndexerRequest = { query: string; variables?: Record<string, any> };

const serveIndexer = ({ query, variables }: IndexerRequest) => {
  if (query.includes("account_transactions")) {
    const funded = variables?.address === ACCOUNTS[0].address;
    return {
      data: {
        account_transactions: funded
          ? [{ transaction_version: NATIVE_TX_VERSION }, { transaction_version: TOKEN_TX_VERSION }]
          : [],
      },
    };
  }
  const where = variables?.where_condition;
  const owner: string = where?.owner_address?._eq;
  const assetType: string | undefined = where?.asset_type?._eq;
  const amount =
    assetType === TOKEN.contractAddress
      ? owner === ACCOUNTS[0].address
        ? TOKEN_BALANCE
        : undefined
      : NATIVE_BALANCES[owner];
  return {
    data: {
      current_fungible_asset_balances:
        amount === undefined ? [] : [{ asset_type: assetType, amount }],
    },
  };
};

const serveFullNode = (url: string) => {
  const version = url.split("/").pop();
  if (url.includes("/transactions/by_version/")) {
    return TRANSACTIONS_BY_VERSION[Number(version)];
  }
  return {
    block_height: String(Number(BLOCK_HEIGHT) - 1),
    block_hash: `0xblock${version}`,
    first_version: version,
    last_version: version,
  };
};

describe("currencyBridge.scanAccounts", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async address =>
        address === TOKEN.contractAddress.toLowerCase() ? TOKEN : undefined,
      findTokenById: async id => (id === TOKEN.id ? TOKEN : undefined),
      getTokensSyncHash: async () => "0",
    });
  });

  beforeEach(() => {
    mockAptosClient.mockImplementation(async (request: any) => {
      const isIndexerQuery = typeof request.body?.query === "string";
      return respond(isIndexerQuery ? serveIndexer(request.body) : serveFullNode(request.url));
    });
    jest.mocked(network).mockResolvedValue({
      data: { block_height: BLOCK_HEIGHT },
      status: 200,
    } as any);
  });

  it("discovers the funded accounts then one empty account with the aptos account shape", async () => {
    const events = await lastValueFrom(
      createBridges(signerContext)
        .currencyBridge.scanAccounts({
          currency: getCryptoCurrencyById("aptos"),
          deviceId: "device",
          syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
        })
        .pipe(toArray()),
    );

    const accounts: Account[] = events
      .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
        return event.type === "discovered";
      })
      .map(event => event.account);

    expect(accounts).toMatchObject([
      {
        id: FUNDED_ACCOUNT_ID,
        index: 0,
        derivationMode: "aptos",
        seedIdentifier: SEED.publicKey,
        freshAddress: ACCOUNTS[0].address,
        freshAddressPath: "44'/637'/0'/0'/0'",
        xpub: ACCOUNTS[0].publicKey,
        used: true,
        operationsCount: 2,
      },
      {
        id: `js:2:aptos:${ACCOUNTS[1].publicKey}:aptos`,
        index: 1,
        derivationMode: "aptos",
        seedIdentifier: SEED.publicKey,
        freshAddress: ACCOUNTS[1].address,
        freshAddressPath: "44'/637'/1'/0'/0'",
        xpub: ACCOUNTS[1].publicKey,
        used: true,
        operationsCount: 0,
      },
      {
        id: `js:2:aptos:${ACCOUNTS[2].publicKey}:aptos`,
        index: 2,
        derivationMode: "aptos",
        seedIdentifier: SEED.publicKey,
        freshAddress: ACCOUNTS[2].address,
        freshAddressPath: "44'/637'/2'/0'/0'",
        xpub: ACCOUNTS[2].publicKey,
        used: false,
        operationsCount: 0,
      },
    ]);
    expect(accounts.map(account => account.balance.toString())).toEqual(["19949100", "5", "0"]);
  });

  it("builds the token sub account of the funded account from its token operations", async () => {
    const events = await lastValueFrom(
      createBridges(signerContext)
        .currencyBridge.scanAccounts({
          currency: getCryptoCurrencyById("aptos"),
          deviceId: "device",
          syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
        })
        .pipe(toArray()),
    );

    const [funded, second] = events
      .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
        return event.type === "discovered";
      })
      .map(event => event.account);

    expect(funded.subAccounts).toMatchObject([
      {
        type: "TokenAccount",
        id: TOKEN_ACCOUNT_ID,
        parentId: FUNDED_ACCOUNT_ID,
        token: { id: TOKEN.id },
        operationsCount: 1,
      },
    ]);
    expect(funded.subAccounts?.[0].balance.toString()).toBe("30000000");
    expect(second.subAccounts).toEqual([]);
  });

  it("converts the fetched transactions of the funded account into operations", async () => {
    const events = await lastValueFrom(
      createBridges(signerContext)
        .currencyBridge.scanAccounts({
          currency: getCryptoCurrencyById("aptos"),
          deviceId: "device",
          syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
        })
        .pipe(toArray()),
    );

    const [funded] = events
      .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
        return event.type === "discovered";
      })
      .map(event => event.account);

    expect(funded.blockHeight).toBe(Number(BLOCK_HEIGHT));
    expect(
      funded.operations.map(op => ({
        hash: op.hash,
        type: op.type,
        value: op.value.toString(),
        fee: op.fee.toString(),
        blockHeight: op.blockHeight,
        senders: op.senders,
        recipients: op.recipients,
        subOperations: op.subOperations?.map(sub => [sub.type, sub.value.toString()]),
      })),
    ).toEqual([
      {
        hash: "0xhash101",
        type: "FEES",
        value: "1000",
        fee: "1000",
        blockHeight: Number(BLOCK_HEIGHT) - 1,
        senders: [ACCOUNTS[0].address],
        recipients: [ACCOUNTS[1].address],
        subOperations: [["OUT", "250"]],
      },
      {
        hash: "0xhash100",
        type: "OUT",
        value: "1000",
        fee: "1000",
        blockHeight: Number(BLOCK_HEIGHT) - 1,
        senders: [ACCOUNTS[0].address],
        recipients: [ACCOUNTS[1].address],
        subOperations: [],
      },
    ]);
  });
});
