import { randomBytes } from "crypto";
import type { AlpacaApi } from "@ledgerhq/coin-framework/api/index";
import dotenv from "dotenv";
import TronWeb from "tronweb";
import { createTronWeb } from "../logic/utils";
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
  let module: AlpacaApi;
  let tronWeb: TronWeb;

  beforeAll(() => {
    module = createApi({
      explorer: {
        url: TRONGRID_URL,
      },
    });

    tronWeb = createTronWeb();
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
    const result = await module.combine(signedTrx.raw_data_hex, signedTrx.signature![0]);
    const txId = await module.broadcast(result);

    // THEN
    expect(txId).toEqual(expect.any(String));
  });

  it("returns operations from latest, but in asc order", async () => {
    // When
    const [txDesc] = await module.listOperations("TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1", {
      minHeight: 0,
      order: "desc",
    });

    // Then
    // Check if the result is sorted in ascending order
    expect(txDesc[0].tx.block.height).toBeGreaterThanOrEqual(
      txDesc[txDesc.length - 1].tx.block.height,
    );
  });
});

/**
 * Use this function to create a new account and seed `.env.integ.test.ts` file with its value.
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
async function _generateNewAccount(trongridUrl: string) {
  const privateKey = randomBytes(32).toString("hex");

  const HttpProvider = TronWeb.providers.HttpProvider;
  const fullNode = new HttpProvider(trongridUrl);
  const solidityNode = new HttpProvider(trongridUrl);
  const eventServer = new HttpProvider(trongridUrl);
  const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);

  const wallet = await tronWeb.createAccount();
  // eslint-disable-next-line no-console
  console.log("New Account generated:\n", wallet);
}
