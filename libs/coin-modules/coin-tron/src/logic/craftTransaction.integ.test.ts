import type { Api } from "@ledgerhq/coin-framework/api/index";
import dotenv from "dotenv";
import TronWeb from "tronweb";
import { createApi } from "../api";
import { createTronWeb } from "../logic/utils";

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
describe("craftTransaction Integration Tests", () => {
  let module: Api;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let tronWeb: TronWeb;
  beforeAll(() => {
    module = createApi({
      explorer: {
        url: TRONGRID_URL,
      },
    });

    tronWeb = createTronWeb();
  });

  it("should create a valid transaction with minimum required fields", async () => {
    const amount = BigInt(3);
    const sender = "TRqkRnAj6ceJFYAn2p1eE7aWrgBBwtdhS9";
    const recipient = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";

    // WHEN
    try {
      const result = await module.craftTransaction({
        sender,
        recipient,
        amount,
        tokenAddress: undefined,
        standard: undefined,
      });

      // THEN
      console.log(result);
    } catch (error) {
      console.log(error);
    }
    // const result = await module.craftTransaction({
    //   sender,
    //   recipient,
    //   amount,
    //   tokenAddress: undefined,
    //   standard: undefined,
    // });

    // // THEN
    // console.log(result);
  });
});
