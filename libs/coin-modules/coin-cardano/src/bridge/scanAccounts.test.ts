import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, reduce, toArray } from "rxjs";
import type { APITransaction } from "../api/api-types";
import { getTransactions } from "../api/getTransactions";
import { getDelegationInfo } from "../api/getDelegationInfo";
import { fetchNetworkInfo } from "../api/getNetworkInfo";
import { cardanoTestnetCoinConfig } from "../fixtures/config";
import { getDelegationFixture } from "../fixtures/delegation";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import {
  getAccountStakeCredential,
  getBipPath,
  getCredentialKey,
  getExtendedPublicKeyFromHex,
} from "../logic";
import type { CardanoSigner } from "../signer";
import { ACCOUNT_KEYS, ASSET_NAME, POLICY_ID, TOKEN } from "../test/fixtures";
import type { CardanoAccount, PaymentCredential } from "../types";
import { PaymentChain } from "../types";
import { createBridges } from "./index";

jest.mock("../api/getTransactions");
jest.mock("../api/getNetworkInfo");
jest.mock("../api/getDelegationInfo");

const mockGetTransactions = jest.mocked(getTransactions);
const mockFetchNetworkInfo = jest.mocked(fetchNetworkInfo);
const mockGetDelegationInfo = jest.mocked(getDelegationInfo);

const credential = (
  accountIndex: number,
  chain: PaymentChain,
  index: number,
  isUsed: boolean,
): PaymentCredential => {
  const accountKey = getExtendedPublicKeyFromHex(
    ACCOUNT_KEYS[accountIndex].publicKeyHex + ACCOUNT_KEYS[accountIndex].chainCodeHex,
  );
  const { key, path } = getCredentialKey(
    accountKey,
    getBipPath({ account: accountIndex, chain, index }),
  );
  return { key, path, isUsed };
};

const FUNDED_EXTERNAL = credential(0, PaymentChain.external, 0, true);
const FUNDED_NEXT_EXTERNAL = credential(0, PaymentChain.external, 1, false);
const FUNDED_INTERNAL = credential(0, PaymentChain.internal, 0, true);
const EMPTY_EXTERNAL = credential(1, PaymentChain.external, 0, false);

const OUTSIDE_ADDRESS = "addr_test1outside";
const OUTSIDE_KEY = "outsidekey";

const token = (value: string) => ({ policyId: POLICY_ID, assetName: ASSET_NAME, value });

const RECEIVE_TX: APITransaction = {
  hash: "hash-receive",
  fees: "200000",
  timestamp: "2023-11-14T22:15:00.000Z",
  blockHeight: 100,
  inputs: [
    {
      txId: "hash-outside",
      index: 0,
      address: OUTSIDE_ADDRESS,
      value: "60000000",
      paymentKey: OUTSIDE_KEY,
      tokens: [],
    },
  ],
  outputs: [
    {
      address: "addr_test1funded",
      value: "50000000",
      paymentKey: FUNDED_EXTERNAL.key,
      tokens: [token("500")],
    },
    { address: OUTSIDE_ADDRESS, value: "9800000", paymentKey: OUTSIDE_KEY, tokens: [] },
  ],
  certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations: [] },
};

const SEND_TX: APITransaction = {
  hash: "hash-send",
  fees: "200000",
  timestamp: "2023-11-14T22:16:40.000Z",
  blockHeight: 200,
  inputs: [
    {
      txId: "hash-receive",
      index: 0,
      address: "addr_test1funded",
      value: "50000000",
      paymentKey: FUNDED_EXTERNAL.key,
      tokens: [token("500")],
    },
  ],
  outputs: [
    {
      address: OUTSIDE_ADDRESS,
      value: "20000000",
      paymentKey: OUTSIDE_KEY,
      tokens: [token("100")],
    },
    {
      address: "addr_test1change",
      value: "29800000",
      paymentKey: FUNDED_INTERNAL.key,
      tokens: [token("400")],
    },
  ],
  certificate: { stakeRegistrations: [], stakeDeRegistrations: [], stakeDelegations: [] },
};

const signer: CardanoSigner = {
  getAddress: jest.fn(async ({ path }) => {
    const index = Number(/^1852'\/1815'\/(\d+)'/.exec(path)?.[1]);
    const keys = ACCOUNT_KEYS[index];
    if (!keys) throw new Error(`unexpected derivation path ${path}`);
    return { addressHex: keys.addressHex };
  }),
  getPublicKey: jest.fn(async (accountPath: string) => {
    const index = Number(/^1852'\/1815'\/(\d+)'$/.exec(accountPath)?.[1]);
    const keys = ACCOUNT_KEYS[index];
    if (!keys) throw new Error(`unexpected account path ${accountPath}`);
    return { publicKeyHex: keys.publicKeyHex, chainCodeHex: keys.chainCodeHex };
  }),
  sign: jest.fn(),
};

const signerContext = ((_deviceId: string, fn: (signer: CardanoSigner) => unknown) =>
  fn(signer)) as unknown as SignerContext<CardanoSigner>;

const bridges = () => createBridges(signerContext, () => cardanoTestnetCoinConfig);

const serveChain = () => {
  mockGetTransactions.mockImplementation(async (_config, xpub, _accountIndex, _initial, from) =>
    xpub.startsWith(ACCOUNT_KEYS[0].publicKeyHex)
      ? {
          transactions: [SEND_TX, RECEIVE_TX].filter(tx => tx.blockHeight >= from),
          blockHeight: 300,
          externalCredentials: [FUNDED_EXTERNAL, FUNDED_NEXT_EXTERNAL],
          internalCredentials: [FUNDED_INTERNAL],
        }
      : {
          transactions: [],
          blockHeight: 300,
          externalCredentials: [EMPTY_EXTERNAL],
          internalCredentials: [],
        },
  );
  mockFetchNetworkInfo.mockResolvedValue({ protocolParams: getProtocolParamsFixture() });
  mockGetDelegationInfo.mockResolvedValue(undefined);
};

const scan = async (): Promise<CardanoAccount[]> => {
  const events = await lastValueFrom(
    bridges()
      .currencyBridge.scanAccounts({
        currency: getCryptoCurrencyById("cardano_testnet"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account as CardanoAccount);
};

const resync = (account: CardanoAccount): Promise<CardanoAccount> =>
  lastValueFrom(
    bridges()
      .accountBridge.sync(account, { paginationConfig: {}, blacklistedTokenIds: [] })
      .pipe(reduce((current, updater) => updater(current), account)),
  );

describe("currencyBridge.scanAccounts", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async (policyId, _currencyId, assetName) =>
        policyId === POLICY_ID && assetName === ASSET_NAME ? TOKEN : undefined,
      findTokenById: async id => (id === TOKEN.id ? TOKEN : undefined),
      getTokensSyncHash: async () => "synchash",
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    serveChain();
  });

  it("discovers the funded account then one empty account with the cardano account shape", async () => {
    const accounts = await scan();

    expect(accounts).toMatchObject([
      {
        index: 0,
        derivationMode: "cardano",
        freshAddressPath: `1852'/1815'/0'/0/1`,
        xpub: ACCOUNT_KEYS[0].publicKeyHex + ACCOUNT_KEYS[0].chainCodeHex,
        used: true,
        blockHeight: 300,
        operationsCount: 2,
      },
      {
        index: 1,
        derivationMode: "cardano",
        freshAddressPath: `1852'/1815'/1'/0/0`,
        xpub: ACCOUNT_KEYS[1].publicKeyHex + ACCOUNT_KEYS[1].chainCodeHex,
        used: false,
        operationsCount: 0,
      },
    ]);
  });

  it("exposes the used and unused credentials of the funded account", async () => {
    const [funded, empty] = await scan();

    expect({
      funded: {
        external: funded.cardanoResources.externalCredentials.map(c => [c.key, c.isUsed]),
        internal: funded.cardanoResources.internalCredentials.map(c => [c.key, c.isUsed]),
      },
      empty: empty.cardanoResources.externalCredentials.map(c => c.isUsed),
    }).toEqual({
      funded: {
        external: [
          [FUNDED_EXTERNAL.key, true],
          [FUNDED_NEXT_EXTERNAL.key, false],
        ],
        internal: [[FUNDED_INTERNAL.key, true]],
      },
      empty: [false],
    });
  });

  it("keeps only the unspent outputs of the account as utxos", async () => {
    const [funded, empty] = await scan();

    expect({
      funded: funded.cardanoResources.utxos.map(utxo => ({
        hash: utxo.hash,
        index: utxo.index,
        amount: utxo.amount.toString(),
        tokens: utxo.tokens.map(t => t.amount.toString()),
      })),
      empty: empty.cardanoResources.utxos,
    }).toEqual({
      funded: [{ hash: "hash-send", index: 1, amount: "29800000", tokens: ["400"] }],
      empty: [],
    });
  });

  it("reports the balance of the utxos and a spendable balance that keeps the minimum ada of the tokens", async () => {
    const [funded, empty] = await scan();

    expect({
      funded: [funded.balance.toString(), funded.spendableBalance.lt(funded.balance)],
      empty: [empty.balance.toString(), empty.spendableBalance.toString()],
    }).toEqual({ funded: ["29800000", true], empty: ["0", "0"] });
  });

  it("adds the staking rewards to the balance without making them spendable", async () => {
    const fundedStakeKey = getAccountStakeCredential(
      ACCOUNT_KEYS[0].publicKeyHex + ACCOUNT_KEYS[0].chainCodeHex,
      0,
    ).key;
    mockGetDelegationInfo.mockImplementation(async (_config, stakeKey) =>
      stakeKey === fundedStakeKey
        ? getDelegationFixture({ rewards: new BigNumber(1e6) })
        : undefined,
    );

    const [funded] = await scan();

    expect({
      balance: funded.balance.toString(),
      spendableWithoutRewards: funded.spendableBalance.lte(29800000),
      delegation: funded.cardanoResources.delegation?.poolId,
    }).toEqual({ balance: "30800000", spendableWithoutRewards: true, delegation: "pool1xyz" });
  });

  it("builds the native token sub account of the funded account", async () => {
    const [funded, empty] = await scan();

    expect(funded.subAccounts).toMatchObject([
      {
        type: "TokenAccount",
        parentId: funded.id,
        token: { id: TOKEN.id },
        operationsCount: 2,
      },
    ]);
    expect(
      funded.subAccounts?.[0].operations.map(op => ({
        hash: op.hash,
        type: op.type,
        value: op.value.toString(),
      })),
    ).toEqual([
      { hash: "hash-send", type: "OUT", value: "100" },
      { hash: "hash-receive", type: "IN", value: "500" },
    ]);
    expect({
      balance: funded.subAccounts?.[0].balance.toString(),
      emptySubAccounts: empty.subAccounts,
    }).toEqual({ balance: "400", emptySubAccounts: [] });
  });

  it("converts the fetched transactions into operations of the account", async () => {
    const [funded] = await scan();

    expect(
      funded.operations.map(op => ({
        hash: op.hash,
        type: op.type,
        value: op.value.toString(),
        fee: op.fee.toString(),
        blockHeight: op.blockHeight,
        senders: op.senders,
        recipients: op.recipients,
      })),
    ).toEqual([
      {
        hash: "hash-send",
        type: "OUT",
        value: "20200000",
        fee: "200000",
        blockHeight: 200,
        senders: ["addr_test1funded"],
        recipients: [OUTSIDE_ADDRESS, "addr_test1change"],
      },
      {
        hash: "hash-receive",
        type: "IN",
        value: "50000000",
        fee: "200000",
        blockHeight: 100,
        senders: [OUTSIDE_ADDRESS],
        recipients: ["addr_test1funded", OUTSIDE_ADDRESS],
      },
    ]);
  });

  describe("resync of an account with existing history", () => {
    it("restores the missing newest operations without duplicating the existing ones", async () => {
      const [funded] = await scan();
      const partial = { ...funded, operations: funded.operations.slice(1) };

      const synced = await resync(partial);

      expect(synced.operations.map(op => op.id)).toEqual(funded.operations.map(op => op.id));
    });

    it("only fetches the transactions after the newest known block", async () => {
      const [funded] = await scan();
      mockGetTransactions.mockClear();

      await resync(funded);

      expect(mockGetTransactions.mock.calls[0][4]).toBe(111);
    });

    it("keeps the references of the existing operations", async () => {
      const [funded] = await scan();
      const existing = funded.operations.slice(1);
      const partial = { ...funded, operations: existing };

      const synced = await resync(partial);

      expect(synced.operations.slice(1).every((op, index) => op === existing[index])).toBe(true);
    });

    it("removes the pending operation once its transaction is in the synced operations", async () => {
      const [funded] = await scan();
      const [newest, ...older] = funded.operations;
      const pending = { ...newest, date: new Date() };

      const synced = await resync({ ...funded, operations: older, pendingOperations: [pending] });

      expect({
        pendingOperations: synced.pendingOperations,
        operationIds: synced.operations.map(op => op.id),
      }).toEqual({ pendingOperations: [], operationIds: funded.operations.map(op => op.id) });
    });

    it("keeps a recent pending operation whose transaction is not in the synced operations yet", async () => {
      const [funded] = await scan();
      const pending = {
        ...funded.operations[0],
        id: "pending-op",
        hash: "pending-hash",
        date: new Date(),
      };

      const synced = await resync({ ...funded, pendingOperations: [pending] });

      expect(synced.pendingOperations.map(op => op.hash)).toEqual(["pending-hash"]);
    });

    it("keeps an old pending operation until its transaction appears because there is no mempool", async () => {
      const [funded] = await scan();
      const pending = {
        ...funded.operations[0],
        id: "pending-op",
        hash: "pending-hash",
        date: new Date(0),
      };

      const synced = await resync({ ...funded, pendingOperations: [pending] });

      expect(synced.pendingOperations.map(op => op.hash)).toEqual(["pending-hash"]);
    });
  });
});
