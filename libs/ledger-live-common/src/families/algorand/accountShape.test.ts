import * as network from "@ledgerhq/coin-algorand/network";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { genericGetAccountShape } from "../../bridge/generic-coin-framework/getAccountShape";
import { algorandConfig } from "./config";

jest.mock("@ledgerhq/coin-algorand/network");
jest.mock("../../bridge/generic-coin-framework/a4/client/registration", () => ({
  ensureA4Registered: jest.fn(),
  clearA4RegistrationCache: jest.fn(),
}));

const ADDRESS = "ALGO_ADDRESS";
const ASA_ID = "123";
const asaToken = {
  type: "TokenCurrency",
  id: `algorand/asa/${ASA_ID}`,
  contractAddress: ASA_ID,
  parentCurrencyId: "algorand",
  tokenType: "asa",
  name: "Token",
  ticker: "TKN",
  units: [{ name: "TKN", code: "TKN", magnitude: 0 }],
} as unknown as TokenCurrency;

const baseTx = {
  timestamp: "1700000000",
  senderAddress: ADDRESS,
  senderRewards: new BigNumber(0),
  recipientRewards: new BigNumber(0),
  closeRewards: undefined,
  closeAmount: undefined,
  fee: new BigNumber(1000),
  note: "",
  type: "axfer",
};

async function sync(transactions: network.AlgoTransaction[]): Promise<Partial<Account>> {
  jest.mocked(network.getAccount).mockResolvedValue({
    round: 100,
    address: ADDRESS,
    balance: new BigNumber(1_000_000),
    pendingRewards: new BigNumber(0),
    assets: [{ assetId: ASA_ID, balance: new BigNumber(10) }],
  });
  jest.mocked(network.getAccountTransactions).mockResolvedValue({ transactions, nextToken: "" });
  jest.mocked(network.getTransactionParams).mockResolvedValue({
    fee: 0,
    minFee: 1000,
    firstRound: 99,
    lastRound: 100,
    genesisHash: "",
    genesisID: "mainnet-v1.0",
  });
  jest
    .mocked(network.getBlock)
    .mockResolvedValue({ block: { gh: "hash", ts: 1700000000 } } as never);

  return genericGetAccountShape("algorand", "local")(
    {
      address: ADDRESS,
      currency: getCryptoCurrencyById("algorand"),
      derivationMode: "",
      index: 0,
      derivationPath: "44'/283'/0'/0'/0'",
    } as never,
    { paginationConfig: {} },
  );
}

describe("algorand account shape on the generic coin framework", () => {
  beforeAll(() => {
    LiveConfig.setConfig(algorandConfig);
    setCryptoAssetsStore({
      findTokenById: async id => (id === asaToken.id ? asaToken : undefined),
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });
  });

  it("builds the ASA sub-account with its operation history", async () => {
    const shape = await sync([
      {
        ...baseTx,
        id: "TX_ASA",
        round: 90,
        details: {
          assetId: ASA_ID,
          assetAmount: new BigNumber(5),
          assetRecipientAddress: "OTHER",
          assetSenderAddress: undefined,
          assetCloseAmount: undefined,
        },
      },
    ]);

    const [subAccount] = shape.subAccounts ?? [];
    expect(subAccount.token.id).toBe(asaToken.id);
    expect(subAccount.operationsCount).toBe(1);
    expect(subAccount.operations[0].type).toBe("OUT");
    expect(subAccount.operations[0].value).toEqual(new BigNumber(5));
    expect(shape.operations?.map(op => op.type)).toEqual(["FEES"]);
  });

  it("keeps a synced opt-in as an OPT_IN operation with its note and rewards", async () => {
    const shape = await sync([
      {
        ...baseTx,
        id: "TX_OPT_IN",
        round: 91,
        note: "hello",
        senderRewards: new BigNumber(800),
        details: {
          assetId: ASA_ID,
          assetAmount: new BigNumber(0),
          assetRecipientAddress: ADDRESS,
          assetSenderAddress: undefined,
          assetCloseAmount: undefined,
        },
      },
    ]);

    expect(shape.operations?.map(op => op.type)).toEqual(["OPT_IN"]);
    expect(shape.operations?.[0].extra).toMatchObject({
      assetId: ASA_ID,
      memo: "hello",
      rewards: new BigNumber(800),
    });
  });
});
