import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Operation, ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { lastValueFrom, reduce, toArray } from "rxjs";
import { setCoinConfig } from "../config";
import { AlgoTransactionType, getAccount, getAllAccountTransactions } from "../network";
import type { AlgoTransaction } from "../network";
import type { AlgorandSigner } from "../signer";
import { sync } from "../synchronization";
import { mockAlgorandConfig } from "../test/context";
import { ASA_TOKEN, ASSET_ID, FUNDED_RECIPIENT, SENDER } from "../test/fixtures";
import { isAlgorandOperationExtra, type AlgorandAccount } from "../types";
import { buildCurrencyBridge } from "./js";

jest.mock("../network", () => ({
  getAccount: jest.fn(),
  getAllAccountTransactions: jest.fn(),
  AlgoTransactionType: { PAYMENT: "pay", ASSET_TRANSFER: "axfer" },
}));

const mockGetAccount = getAccount as jest.Mock;
const mockGetTransactions = getAllAccountTransactions as jest.Mock;

const ADDRESS_BY_INDEX = [SENDER, FUNDED_RECIPIENT];
const PUBLIC_KEY_BY_ADDRESS = {
  [SENDER]: "c8b672d16c497bb097a48f09a9cccf0c4c7d6391acb7a4e7cd3f236fadbef9c4",
  [FUNDED_RECIPIENT]: "6104eb314f51f4db5733976bd8c066297019ebaa6adcf39b4aa318d553c571cc",
};

const signer: AlgorandSigner = {
  getAddress: jest.fn(async (path: string) => {
    const index = Number(/^44'\/283'\/(\d+)'/.exec(path)?.[1]);
    const address = ADDRESS_BY_INDEX[index];
    if (!address) throw new Error(`unexpected derivation path ${path}`);
    return { address, publicKey: PUBLIC_KEY_BY_ADDRESS[address] };
  }),
  sign: jest.fn(),
};

const signerContext = ((_deviceId: string, fn: (signer: AlgorandSigner) => unknown) =>
  fn(signer)) as unknown as SignerContext<AlgorandSigner>;

const payment = ({
  id,
  round,
  from,
  to,
  amount,
  recipientRewards = "0",
}: {
  id: string;
  round: number;
  from: string;
  to: string;
  amount: string;
  recipientRewards?: string;
}): AlgoTransaction => ({
  id,
  timestamp: String(1700000000 + round),
  round,
  senderAddress: from,
  senderRewards: new BigNumber(0),
  recipientRewards: new BigNumber(recipientRewards),
  closeRewards: undefined,
  closeAmount: undefined,
  fee: new BigNumber(1000),
  note: "",
  type: AlgoTransactionType.PAYMENT,
  details: {
    amount: new BigNumber(amount),
    recipientAddress: to,
    closeAmount: undefined,
    closeToAddress: undefined,
  },
});

const assetTransfer = ({
  id,
  round,
  from,
  to,
  amount,
}: {
  id: string;
  round: number;
  from: string;
  to: string;
  amount: string;
}): AlgoTransaction => ({
  id,
  timestamp: String(1700000000 + round),
  round,
  senderAddress: from,
  senderRewards: new BigNumber(0),
  recipientRewards: new BigNumber(0),
  closeRewards: undefined,
  closeAmount: undefined,
  fee: new BigNumber(1000),
  note: "",
  type: AlgoTransactionType.ASSET_TRANSFER,
  details: {
    assetId: ASSET_ID,
    assetAmount: new BigNumber(amount),
    assetRecipientAddress: to,
    assetSenderAddress: undefined,
    assetCloseAmount: undefined,
    assetCloseToAddress: undefined,
  },
});

const TRANSACTIONS = [
  assetTransfer({
    id: "tx-asa-out",
    round: 300,
    from: SENDER,
    to: FUNDED_RECIPIENT,
    amount: "1000",
  }),
  payment({ id: "tx-pay-out", round: 200, from: SENDER, to: FUNDED_RECIPIENT, amount: "50000" }),
  assetTransfer({ id: "tx-opt-in", round: 150, from: SENDER, to: SENDER, amount: "0" }),
  payment({
    id: "tx-pay-in",
    round: 100,
    from: FUNDED_RECIPIENT,
    to: SENDER,
    amount: "2000000",
    recipientRewards: "7",
  }),
];

const serveChain = () => {
  mockGetAccount.mockImplementation(async (_config: unknown, address: string) =>
    address === SENDER
      ? {
          round: 50000000,
          address,
          balance: new BigNumber("1167089"),
          pendingRewards: new BigNumber("4242"),
          assets: [
            { assetId: ASSET_ID, balance: new BigNumber("4000") },
            { assetId: "31231", balance: new BigNumber("0") },
          ],
        }
      : {
          round: 50000000,
          address,
          balance: new BigNumber(0),
          pendingRewards: new BigNumber(0),
          assets: [],
        },
  );
  mockGetTransactions.mockImplementation(
    async (_config: unknown, address: string, startAt: number = 0) =>
      address === SENDER ? TRANSACTIONS.filter(tx => tx.round >= startAt) : [],
  );
};

const resync = (account: AlgorandAccount): Promise<AlgorandAccount> =>
  lastValueFrom(
    sync(account, { paginationConfig: {}, blacklistedTokenIds: [] }).pipe(
      reduce((current, updater) => updater(current), account),
    ),
  );

const rewardsOf = (op: Operation): string | undefined =>
  isAlgorandOperationExtra(op.extra) ? op.extra.rewards?.toString() : undefined;

const scan = async (): Promise<AlgorandAccount[]> => {
  const events = await lastValueFrom(
    buildCurrencyBridge(signerContext)
      .scanAccounts({
        currency: getCryptoCurrencyById("algorand"),
        deviceId: "device",
        syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
      })
      .pipe(toArray()),
  );

  return events
    .filter((event): event is Extract<ScanAccountEvent, { type: "discovered" }> => {
      return event.type === "discovered";
    })
    .map(event => event.account as AlgorandAccount);
};

describe("currencyBridge.scanAccounts", () => {
  beforeAll(() => {
    setCryptoAssetsStore({
      findTokenByAddressInCurrency: async () => undefined,
      findTokenById: async id => (id === ASA_TOKEN.id ? ASA_TOKEN : undefined),
      getTokensSyncHash: async () => "0",
    });
  });

  beforeEach(() => {
    setCoinConfig(() => mockAlgorandConfig);
    serveChain();
  });

  it("discovers the funded account then one empty account with the algorand account shape", async () => {
    const accounts = await scan();

    expect(accounts).toMatchObject([
      {
        id: `js:2:algorand:${SENDER}:`,
        index: 0,
        derivationMode: "",
        seedIdentifier: PUBLIC_KEY_BY_ADDRESS[SENDER],
        freshAddress: SENDER,
        freshAddressPath: "44'/283'/0'/0/0",
        xpub: SENDER,
        used: true,
        blockHeight: 50000000,
        operationsCount: 4,
        algorandResources: { nbAssets: 2 },
      },
      {
        id: `js:2:algorand:${FUNDED_RECIPIENT}:`,
        index: 1,
        derivationMode: "",
        freshAddress: FUNDED_RECIPIENT,
        freshAddressPath: "44'/283'/1'/0/0",
        used: false,
        operationsCount: 0,
        algorandResources: { nbAssets: 0 },
      },
    ]);
  });

  it("reports the balance, the spendable balance and the pending rewards", async () => {
    const [funded, empty] = await scan();

    expect({
      funded: [
        funded.balance.toString(),
        funded.spendableBalance.toString(),
        funded.algorandResources.rewards.toString(),
      ],
      empty: [empty.balance.toString(), empty.spendableBalance.toString()],
    }).toEqual({
      funded: ["1167089", "867089", "4242"],
      empty: ["0", "0"],
    });
  });

  it("builds the ASA sub account of a known token and ignores an unknown opted-in asset", async () => {
    const [funded, empty] = await scan();

    expect(funded.subAccounts).toMatchObject([
      {
        type: "TokenAccount",
        id: `js:2:algorand:${SENDER}:+${ASSET_ID}`,
        parentId: `js:2:algorand:${SENDER}:`,
        token: { id: ASA_TOKEN.id },
        operationsCount: 1,
        operations: [{ hash: "tx-asa-out", type: "OUT", blockHeight: 300 }],
      },
    ]);
    expect({
      balance: funded.subAccounts?.[0].balance.toString(),
      emptySubAccounts: empty.subAccounts,
    }).toEqual({ balance: "4000", emptySubAccounts: [] });
  });

  it("maps payments, asset transfers and opt-ins to operations", async () => {
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
        rewards: rewardsOf(op),
      })),
    ).toEqual([
      {
        hash: "tx-asa-out",
        type: "FEES",
        value: "1000",
        fee: "1000",
        blockHeight: 300,
        senders: [SENDER],
        recipients: [FUNDED_RECIPIENT],
        rewards: "0",
      },
      {
        hash: "tx-pay-out",
        type: "OUT",
        value: "51000",
        fee: "1000",
        blockHeight: 200,
        senders: [SENDER],
        recipients: [FUNDED_RECIPIENT],
        rewards: "0",
      },
      {
        hash: "tx-opt-in",
        type: "OPT_IN",
        value: "1000",
        fee: "1000",
        blockHeight: 150,
        senders: [SENDER],
        recipients: [SENDER],
        rewards: "0",
      },
      {
        hash: "tx-pay-in",
        type: "IN",
        value: "2000007",
        fee: "1000",
        blockHeight: 100,
        senders: [FUNDED_RECIPIENT],
        recipients: [SENDER],
        rewards: "7",
      },
    ]);
  });

  it("attaches the ASA sub operation to the parent operation of the same transaction", async () => {
    const [funded] = await scan();

    expect(funded.operations[0].subOperations).toMatchObject([
      { hash: "tx-asa-out", type: "OUT", value: new BigNumber(1000) },
    ]);
  });

  describe("resync of an account with existing history", () => {
    it("restores the missing newest operations without duplicating the existing ones", async () => {
      const [funded] = await scan();
      const partial = { ...funded, operations: funded.operations.slice(1), blockHeight: 0 };

      const synced = await resync(partial);

      expect(synced.operations.map(op => op.id)).toEqual(funded.operations.map(op => op.id));
    });

    it("only fetches the transactions after the newest known operation", async () => {
      const [funded] = await scan();
      const partial = { ...funded, operations: funded.operations.slice(1), blockHeight: 0 };
      mockGetTransactions.mockClear();

      await resync(partial);

      expect(mockGetTransactions).toHaveBeenCalledWith(expect.anything(), SENDER, 201);
    });

    it("keeps the references of the existing operations", async () => {
      const [funded] = await scan();
      const existing = funded.operations.slice(1);
      const partial = { ...funded, operations: existing, blockHeight: 0 };

      const synced = await resync(partial);

      expect(synced.operations.slice(1).every((op, index) => op === existing[index])).toBe(true);
    });

    it("keeps a recent pending operation that is not in the fetched history", async () => {
      const [funded] = await scan();
      const pending = {
        ...funded.operations[0],
        id: "pending-op",
        hash: "pending-hash",
        date: new Date(),
      };
      const partial = { ...funded, pendingOperations: [pending] };

      const synced = await resync(partial);

      expect(synced.pendingOperations.map(op => op.hash)).toEqual(["pending-hash"]);
    });

    it("drops a pending operation once it is older than the optimistic retention", async () => {
      const [funded] = await scan();
      const pending = {
        ...funded.operations[0],
        id: "pending-op",
        hash: "pending-hash",
        date: new Date(0),
      };
      const partial = { ...funded, pendingOperations: [pending] };

      const synced = await resync(partial);

      expect(synced.pendingOperations).toEqual([]);
    });
  });
});
