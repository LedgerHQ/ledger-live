import {
  MINA_DECIMALS,
  MINA_SYMBOL,
  MINA_TOKEN_ID,
  MAINNET_NETWORK_IDENTIFIER,
} from "../../consts";
import { addNetworkIdentifier, buildAccountIdentifier, makeTransferPayload } from "./utils";

describe("addNetworkIdentifier", () => {
  it("should add network identifier to an empty object", () => {
    const result = addNetworkIdentifier({});
    expect(result).toEqual(MAINNET_NETWORK_IDENTIFIER);
  });

  it("should add network identifier to an object with existing properties", () => {
    const testObj = { test: "value" };
    const result = addNetworkIdentifier(testObj);
    expect(result).toEqual({
      ...MAINNET_NETWORK_IDENTIFIER,
      test: "value",
    });
  });

  it("should override network identifier properties if they exist in input object", () => {
    // Assuming MAINNET_NETWORK_IDENTIFIER has a property like { blockchain: 'Mina' }
    const testObj = { blockchain: "mina" };
    const result = addNetworkIdentifier(testObj);
    expect(result.network_identifier.blockchain).toEqual("mina");
  });
});

describe("buildAccountIdentifier", () => {
  it("should build correct account identifier with given address", () => {
    const testAddress = "B62qrPN5Y5yq8kGE3FbVKbGTdTAJNdtNtB5sNVpxyRwWGcDEhpMzc8g";
    const result = buildAccountIdentifier(testAddress);

    expect(result).toEqual({
      account_identifier: {
        address: testAddress,
        metadata: {
          token_id: MINA_TOKEN_ID,
        },
      },
    });
  });
});

describe("makeTransferPayload", () => {
  const fromAddr = "sender-address";
  const toAddr = "recipient-address";
  const feeNano = 1000000;
  const valueNano = 5000000;

  it("should create a valid transfer payload with three operations", () => {
    const result = makeTransferPayload(fromAddr, toAddr, feeNano, valueNano);

    expect(result.operations).toHaveLength(3);
  });

  it("should correctly create fee payment operation", () => {
    const result = makeTransferPayload(fromAddr, toAddr, feeNano, valueNano);

    const feeOp = result.operations[0];
    expect(feeOp.operation_identifier.index).toBe(0);
    expect(feeOp.type).toBe("fee_payment");
    expect(feeOp.account.address).toBe(fromAddr);
    expect(feeOp.amount.value).toBe("-" + feeNano.toString());
    expect(feeOp.amount.currency.symbol).toBe(MINA_SYMBOL);
    expect(feeOp.amount.currency.decimals).toBe(MINA_DECIMALS);
  });

  it("should correctly create payment source operation", () => {
    const result = makeTransferPayload(fromAddr, toAddr, feeNano, valueNano);

    const sourceOp = result.operations[1];
    expect(sourceOp.operation_identifier.index).toBe(1);
    expect(sourceOp.type).toBe("payment_source_dec");
    expect(sourceOp.account.address).toBe(fromAddr);
    expect(sourceOp.amount.value).toBe("-" + valueNano.toString());
  });

  it("should correctly create payment receiver operation with related operation", () => {
    const result = makeTransferPayload(fromAddr, toAddr, feeNano, valueNano);

    const receiverOp = result.operations[2];
    expect(receiverOp.operation_identifier.index).toBe(2);
    expect(receiverOp.type).toBe("payment_receiver_inc");
    expect(receiverOp.account.address).toBe(toAddr);
    expect(receiverOp.amount.value).toBe(valueNano.toString());
    expect(receiverOp.relatedOps.related_operations).toEqual([{ index: 1 }]);
  });

  it("should handle zero values correctly", () => {
    const result = makeTransferPayload(fromAddr, toAddr, 0, 0);

    expect(result.operations[0].amount.value).toBe("-0");
    expect(result.operations[1].amount.value).toBe("-0");
    expect(result.operations[2].amount.value).toBe("0");
  });
});
