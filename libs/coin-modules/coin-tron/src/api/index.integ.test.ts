import { randomBytes } from "crypto";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/index";
import { withDefaults } from "@ledgerhq/coin-module-framework/api/index";
import dotenv from "dotenv";
import { TronWeb, providers } from "tronweb";
import { createTronWeb } from "../logic/utils";
import type { TronCoinConfig, TronContext } from "../config";
import type { TronMemo, TronTxData } from "../types";
import { createApi } from ".";

const TRONGRID_URL = "https://api.shasta.trongrid.io";
dotenv.config();

const wallet = {
  privateKey: process.env.WALLET_SECRET_KEY,
  publicKey: process.env.WALLET_PUB_KEY,
  address: {
    base58: process.env.WALLET_ADDRESS_BASE58,
    hex: process.env.WALLET_ADDRESS_HEX,
  },
};

/**
 * Tron testnet: https://api.shasta.trongrid.io
 * Tron testnet faucet: https://shasta.tronex.io/
 * Create a tesnet account: https://stackoverflow.com/questions/66651807/how-to-create-a-tron-wallet-with-nodejs
 * Testnet faucet: https://shasta.tronex.io/
 */
describe("API", () => {
  let module: CoinModuleApi<TronCoinConfig, TronMemo, TronTxData>;
  let tronWeb: TronWeb;

  const config = {
    explorer: { url: TRONGRID_URL },
    status: { type: "active" },
  } as TronCoinConfig;

  const context: TronContext = {
    config: async () => config,
    logger: () => {},
  };

  beforeAll(() => {
    module = withDefaults(createApi());

    tronWeb = createTronWeb(TRONGRID_URL);
  });

  it.skip("combine and broadcast a send transaction successfully", async () => {
    // GIVEN
    const amount = 100;
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";
    const unsignedTx = await tronWeb.transactionBuilder.sendTrx(
      recipient,
      amount,
      wallet.address.base58,
    );

    const signedTrx = await tronWeb.trx.sign(unsignedTx, wallet.privateKey);

    // WHEN
    const result = await module.combine(context, signedTrx.raw_data_hex, [signedTrx.signature![0]]);
    const txId = await module.broadcast(context, result);

    // THEN
    expect(txId).toEqual(expect.any(String));
  });

  it("returns operations from latest, but in asc order", async () => {
    // When
    const { items: txDesc } = await module.listOperations(
      context,
      "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1",
      {
        minHeight: 0,
        order: "desc",
      },
    );

    // Then
    // Check if the result is sorted in ascending order
    expect(txDesc[0].tx.block.height).toBeGreaterThanOrEqual(
      txDesc[txDesc.length - 1].tx.block.height,
    );

    // check format of operations
    txDesc.forEach((operation: (typeof txDesc)[number]) => {
      // there is always a fee payer equal to the sender address
      expect(operation.tx.feesPayer).toBe(operation.senders[0]);
    });
  });

  it("getAccountInfo returns tron account resources", async () => {
    const info = await module.getAccountInfo!(context, "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1");

    expect(info).toMatchObject({
      type: "tron",
      energyLimit: expect.any(Number),
      energy: expect.any(Number),
      bandwidth: expect.any(Number),
    });
    // available amounts and the limit are never negative
    const { energyLimit, energy, bandwidth } = info as unknown as {
      energyLimit: number;
      energy: number;
      bandwidth: number;
    };
    expect(energyLimit).toBeGreaterThanOrEqual(0);
    expect(energy).toBeGreaterThanOrEqual(0);
    expect(bandwidth).toBeGreaterThanOrEqual(0);
  });

  it("getBlockInfo returns valid block info", async () => {
    const lastBlockInfo = await module.lastBlock(context);
    const blockHeight = lastBlockInfo.height - 10;

    const result = await module.getBlockInfo(context, blockHeight);

    expect(result).toMatchObject({
      height: blockHeight,
      hash: expect.any(String),
      time: expect.any(Date),
    });
  });

  it("getBlock returns block with info and transactions", async () => {
    const lastBlockInfo = await module.lastBlock(context);
    const blockHeight = lastBlockInfo.height - 10;

    const result = await module.getBlock(context, blockHeight);

    expect(result).toMatchObject({
      info: {
        height: blockHeight,
        hash: expect.any(String),
        time: expect.any(Date),
        parent: {
          height: blockHeight - 1,
          hash: expect.any(String),
        },
      },
      transactions: expect.any(Array),
    });
  });
});

/**
 * Use this function to create a new account and seed `.env.integ.test.ts` file with its value.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
async function _generateNewAccount(trongridUrl: string) {
  const privateKey = randomBytes(32).toString("hex");

  const HttpProvider = providers.HttpProvider;
  const fullNode = new HttpProvider(trongridUrl);
  const solidityNode = new HttpProvider(trongridUrl);
  const eventServer = new HttpProvider(trongridUrl);
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

  const wallet = await tronWeb.createAccount();
  // eslint-disable-next-line no-console
  console.log("New Account generated:\n", wallet);
}
