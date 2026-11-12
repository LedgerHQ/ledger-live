import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import getDeviceTransactionConfig from "./deviceTransactionConfig";

describe("getDeviceTransactionConfig", () => {
  const mockAccount: Account = {
    type: "Account",
    currency: {
      id: "cardano",
      family: "cardano",
      units: [{ code: "ADA", magnitude: 6 }],
    },
    cardanoResources: {
      protocolParams: {
        utxoCostPerByte: "4310",
      },
    },
  } as any;

  it("should return fields for send transaction with fees", async () => {
    const result = await getDeviceTransactionConfig({
      account: mockAccount,
      parentAccount: null,
      transaction: {
        mode: "send",
        amount: new BigNumber(1000000),
        fees: new BigNumber(170000),
        recipient: "addr_test1qz",
      } as any,
      status: {} as any,
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "text", label: "Transaction Fee" })]),
    );
  });

  it("omits the ADA field of a token send when utxoCostPerByte is unreadable", async () => {
    const tokenAccount = {
      type: "TokenAccount",
      token: {
        id: `cardano/native/${"a".repeat(56)}74657374`,
        units: [{ code: "TEST", magnitude: 0 }],
      },
      balance: new BigNumber(1000),
    } as any;

    const result = await getDeviceTransactionConfig({
      account: tokenAccount,
      parentAccount: mockAccount,
      transaction: {
        mode: "send",
        amount: new BigNumber(500),
        recipient: "addr_test1qz",
        protocolParams: { utxoCostPerByte: "abc" },
      } as any,
      status: {} as any,
    });

    expect(result.map(field => field.label)).toEqual(["Token Name", "Amount"]);
  });
});
