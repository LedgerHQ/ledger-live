import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";

import { BigNumber } from "bignumber.js";
import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { buildTransaction } from "./buildTransaction";
import coinConfig from "../config";
import { getFullnodeUrl } from "@mysten/sui/client";

// Function to extract coinType from unsigned transaction bytes
async function extractCoinTypeFromUnsignedTx(
  unsignedTxBytes: Uint8Array,
): Promise<string[] | null> {
  const tx = Transaction.from(unsignedTxBytes);
  const data = tx.getData();

  const gasObjectIds = data.gasData.payment?.map(object => object.objectId) ?? [];
  const inputObjectIds = data.inputs
    .map(input => {
      return input.$kind === "Object" && input.Object.$kind === "ImmOrOwnedObject"
        ? input.Object.ImmOrOwnedObject.objectId
        : null;
    })
    .filter((objectId): objectId is string => !!objectId);

  const suiClient = new SuiClient({ url: getFullnodeUrl("mainnet") });
  const objects = await suiClient.multiGetObjects({
    ids: [...gasObjectIds, ...inputObjectIds],
    options: {
      showBcs: true,
      showPreviousTransaction: true,
      showStorageRebate: true,
      showOwner: true,
    },
  });

  const coinObjects = objects.filter(obj => {
    const bcsData = obj.data?.bcs as any;
    return bcsData.type.includes("coin");
  });

  const coinTypes: string[] = coinObjects.map(obj => (obj.data?.bcs as any).type);

  return coinTypes;
}

describe("buildTransaction", () => {
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

  it("returns unsigned tx bytes for given tx with USDT coin type and can decode coinType from unsigned", async () => {
    // GIVEN
    const account = createFixtureAccount({
      freshAddress: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
    });
    const transaction = createFixtureTransaction({
      coinType: "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
      amount: BigNumber(1),
    });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(result).not.toBeNull();
    expect(result.unsigned).toBeInstanceOf(Uint8Array);

    // Decode and extract coinType
    const resultCoinTypes = await extractCoinTypeFromUnsignedTx(result.unsigned);
    expect(resultCoinTypes).toEqual(expect.arrayContaining([expect.stringContaining("usdt")]));
  });

  it("returns unsigned tx bytes for given tx with native SUI coin type and can decode coinType from unsigned", async () => {
    // GIVEN
    const account = createFixtureAccount({
      freshAddress: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
    });
    const transaction = createFixtureTransaction({
      coinType: "0x2::sui::SUI",
      amount: BigNumber(1000000),
    });

    // WHEN
    const result = await buildTransaction(account, transaction);

    // THEN
    expect(result).not.toBeNull();
    expect(result.unsigned).toBeInstanceOf(Uint8Array);

    // Decode and extract coinType
    const resultCoinTypes = await extractCoinTypeFromUnsignedTx(result.unsigned);
    expect(resultCoinTypes).toEqual(expect.arrayContaining([expect.stringContaining("sui")]));
  });
});
