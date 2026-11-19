import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, toArray } from "rxjs";
import hederaCoinConfig from "../config";
import { HARDCODED_BLOCK_HEIGHT } from "../constants";
import * as logic from "../logic";
import { apiClient } from "../network/api";
import * as networkUtils from "../network/utils";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedMirrorAccount, getMockedMirrorToken } from "../test/fixtures/mirror.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import type { HederaAccount, HederaSigner } from "../types";
import { createBridges } from "./index";

jest.mock("../network/api");
jest.mock("../network/utils");
jest.mock("../logic");

const PUBLIC_KEY = "9e92a312233d5fd6b5a723875aeea2cea81a8e48ffc00341cff6dffcfd3ab7f2";
const FUNDED = getMockedMirrorAccount({
  account: "0.0.1040977",
  evm_address: "0x00000000000000000000000000000000000fe4d1",
  balance: { balance: 2500000000, timestamp: "1764932745.835883000", tokens: [] },
  staked_node_id: 3,
  pending_reward: 4200,
});
const EMPTY = getMockedMirrorAccount({
  account: "0.0.1040978",
  evm_address: "0x00000000000000000000000000000000000fe4d2",
  balance: { balance: 0, timestamp: "1764932745.835883000", tokens: [] },
  max_automatic_token_associations: 0,
});
const OTHER = "0.0.9999";

const HTS_TOKEN = getMockedHTSTokenCurrency();

const signer: HederaSigner = {
  getPublicKey: jest.fn(async (path: string) => {
    if (path !== "44/3030") throw new Error(`unexpected derivation path ${path}`);
    return PUBLIC_KEY;
  }),
  signTransaction: jest.fn(),
};

const signerContext = ((_deviceId: string, fn: (signer: HederaSigner) => unknown) =>
  fn(signer)) as unknown as SignerContext<HederaSigner>;

const coinOperations = [
  getMockedOperation({
    hash: "hash-fees",
    type: "FEES",
    value: new BigNumber(100000),
    fee: new BigNumber(100000),
    senders: [FUNDED.account],
    recipients: [],
    blockHeight: 1,
    date: new Date(1700000300000),
  }),
  getMockedOperation({
    hash: "hash-out",
    type: "OUT",
    value: new BigNumber(1000100000),
    fee: new BigNumber(100000),
    senders: [FUNDED.account],
    recipients: [OTHER],
    blockHeight: 1,
    date: new Date(1700000200000),
  }),
  getMockedOperation({
    hash: "hash-in",
    type: "IN",
    value: new BigNumber(5000000000),
    fee: new BigNumber(0),
    senders: [OTHER],
    recipients: [FUNDED.account],
    blockHeight: 1,
    date: new Date(1700000100000),
  }),
];

const tokenOperations = [
  getMockedOperation({
    hash: "hash-fees",
    type: "OUT",
    value: new BigNumber(40),
    fee: new BigNumber(0),
    senders: [FUNDED.account],
    recipients: [OTHER],
    blockHeight: 1,
    date: new Date(1700000300000),
    contract: HTS_TOKEN.contractAddress,
  }),
];

const serveChain = () => {
  jest.mocked(apiClient.getAccountsForPublicKey).mockResolvedValue([FUNDED, EMPTY]);
  jest
    .mocked(apiClient.getAccount)
    .mockImplementation(async ({ address }) => (address === FUNDED.account ? FUNDED : EMPTY));
  jest
    .mocked(apiClient.getAccountTokens)
    .mockImplementation(async ({ address }) =>
      address === FUNDED.account
        ? [getMockedMirrorToken({ token_id: HTS_TOKEN.contractAddress, balance: 460 })]
        : [],
    );
  jest
    .mocked(networkUtils.toEVMAddress)
    .mockImplementation(async ({ accountId }) =>
      accountId === FUNDED.account ? FUNDED.evm_address : EMPTY.evm_address,
    );
  jest.mocked(networkUtils.getERC20BalancesForAccountV2).mockResolvedValue([]);
  jest
    .mocked(logic.listOperationsV2)
    .mockImplementation(async (_config, { address }) =>
      address === FUNDED.account
        ? { coinOperations, tokenOperations, nextCursor: null }
        : { coinOperations: [], tokenOperations: [], nextCursor: null },
    );
};

const scan = async (): Promise<HederaAccount[]> => {
  const events = await lastValueFrom(
    createBridges(signerContext, () => getMockedConfig())
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("hedera"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map((event): Account => event.account) as HederaAccount[];
};

describe("currencyBridge.scanAccounts", () => {
  beforeAll(() => {
    hederaCoinConfig.setCoinConfig(() => getMockedConfig());
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async address =>
        address === HTS_TOKEN.contractAddress ? HTS_TOKEN : undefined,
      findTokenById: async id => (id === HTS_TOKEN.id ? HTS_TOKEN : undefined),
      getTokensSyncHash: async () => "synchash",
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    serveChain();
  });

  it("discovers the funded account then one empty account with the hedera account shape", async () => {
    const accounts = await scan();

    expect(accounts).toMatchObject([
      {
        id: `js:2:hedera:${FUNDED.account}:hederaBip44`,
        index: 0,
        derivationMode: "hederaBip44",
        seedIdentifier: PUBLIC_KEY,
        freshAddress: FUNDED.account,
        freshAddressPath: "44/3030",
        used: true,
        blockHeight: HARDCODED_BLOCK_HEIGHT,
        operationsCount: 3,
        hederaResources: {
          maxAutomaticTokenAssociations: -1,
          isAutoTokenAssociationEnabled: true,
          delegation: { nodeId: 3 },
        },
      },
      {
        id: `js:2:hedera:${EMPTY.account}:hederaBip44`,
        index: 1,
        derivationMode: "hederaBip44",
        freshAddress: EMPTY.account,
        freshAddressPath: "44/3030",
        used: false,
        operationsCount: 0,
        hederaResources: {
          maxAutomaticTokenAssociations: 0,
          isAutoTokenAssociationEnabled: false,
          delegation: null,
        },
      },
    ]);
  });

  it("reports the mirror node balance and the staking delegation", async () => {
    const [funded, empty] = await scan();

    expect({
      funded: [funded.balance.toString(), funded.spendableBalance.toString()],
      delegation: {
        nodeId: funded.hederaResources?.delegation?.nodeId,
        delegated: funded.hederaResources?.delegation?.delegated.toString(),
        pendingReward: funded.hederaResources?.delegation?.pendingReward.toString(),
      },
      empty: [empty.balance.toString(), empty.spendableBalance.toString()],
    }).toEqual({
      funded: ["2500000000", "2500000000"],
      delegation: { nodeId: 3, delegated: "2500000000", pendingReward: "4200" },
      empty: ["0", "0"],
    });
  });

  it("builds the HTS token sub account of the funded account from its associated token", async () => {
    const [funded, empty] = await scan();

    expect(funded.subAccounts).toMatchObject([
      {
        type: "TokenAccount",
        parentId: funded.id,
        token: { id: HTS_TOKEN.id },
        operationsCount: 1,
        operations: [{ hash: "hash-fees", type: "OUT" }],
      },
    ]);
    expect({
      balance: funded.subAccounts?.[0].balance.toString(),
      emptySubAccounts: empty.subAccounts,
    }).toEqual({ balance: "460", emptySubAccounts: [] });
  });

  it("keeps the coin operations ordered with the token transfer attached to its fees operation", async () => {
    const [funded] = await scan();

    expect(
      funded.operations.map(op => ({
        hash: op.hash,
        type: op.type,
        value: op.value.toString(),
        fee: op.fee.toString(),
        senders: op.senders,
        recipients: op.recipients,
        subOperations: op.subOperations?.map(sub => sub.type),
      })),
    ).toEqual([
      {
        hash: "hash-fees",
        type: "FEES",
        value: "100000",
        fee: "100000",
        senders: [FUNDED.account],
        recipients: [],
        subOperations: ["OUT"],
      },
      {
        hash: "hash-out",
        type: "OUT",
        value: "1000100000",
        fee: "100000",
        senders: [FUNDED.account],
        recipients: [OTHER],
        subOperations: [],
      },
      {
        hash: "hash-in",
        type: "IN",
        value: "5000000000",
        fee: "0",
        senders: [OTHER],
        recipients: [FUNDED.account],
        subOperations: [],
      },
    ]);
  });

  it("reads the accounts of the device public key from the mirror node", async () => {
    await scan();

    expect(apiClient.getAccountsForPublicKey).toHaveBeenCalledWith({
      configOrCurrencyId: "hedera",
      publicKey: PUBLIC_KEY,
    });
  });
});
