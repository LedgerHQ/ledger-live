import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { getFullnodeUrl } from "@mysten/sui/client";
import coinConfig from "../config";
import { extractCoinTypeFromUnsignedTx } from "../test/testUtils";
import { craftTransaction } from "./craftTransaction";

const SENDER = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";
const RECIPIENT = "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164";

describe("craftTransaction", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      node: {
        url: getFullnodeUrl("mainnet"),
      },
    }));
  });

  it("should craft a native SUI send transaction", async () => {
    const transactionIntent: TransactionIntent = {
      sender: SENDER,
      recipient: RECIPIENT,
      amount: BigInt(1000),
      type: "send",
      asset: { type: "native" },
    };

    const result = await craftTransaction(transactionIntent);

    expect(result).toBeDefined();
    expect(result.unsigned).toBeInstanceOf(Uint8Array);

    const resultCoinTypes = await extractCoinTypeFromUnsignedTx(result.unsigned);
    expect(resultCoinTypes).toEqual(expect.arrayContaining([expect.stringContaining("sui")]));
  }, 15000);

  it("should craft a token send transaction", async () => {
    const coinType =
      "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT";

    const transactionIntent: TransactionIntent = {
      sender: SENDER,
      recipient: RECIPIENT,
      amount: BigInt(1000),
      type: "send",
      asset: {
        type: "token",
        assetReference: coinType,
      },
    };

    const result = await craftTransaction(transactionIntent);

    expect(result).toBeDefined();
    expect(result.unsigned).toBeInstanceOf(Uint8Array);

    const resultCoinTypes = await extractCoinTypeFromUnsignedTx(result.unsigned);
    expect(resultCoinTypes).toEqual(expect.arrayContaining([expect.stringContaining("usdt")]));
  }, 15000);
});
