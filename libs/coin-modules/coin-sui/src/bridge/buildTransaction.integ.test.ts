import { getFullnodeUrl } from "@mysten/sui/client";
import { BigNumber } from "bignumber.js";
import coinConfig from "../config";
import { extractCoinTypeFromUnsignedTx } from "../test/testUtils";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";

import { buildTransaction } from "./buildTransaction";

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
      id: "parentAccountId",
      freshAddress: "0x33444cf803c690db96527cec67e3c9ab512596f4ba2d4eace43f0b4f716e0164",
      subAccounts: [
        createFixtureAccount({
          id: "subAccountId",
          parentId: "parentAccountId",
          type: "TokenAccount",
          token: {
            contractAddress:
              "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
          },
        }),
      ],
    });
    const transaction = createFixtureTransaction({
      subAccountId: "subAccountId",
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
