import { fetchEstimatedFees } from "../api/api";
import {
  validateAddress,
  isFilEthAddress,
  isEthereumConvertableAddr,
} from "../network/addresses";
import type { ValidateAddressResult } from "../network/addresses";
import { Methods } from "../bridge/utils";
import { createMockEstimatedFeesResponse } from "../test/fixtures";
import { craftTransaction } from "./craftTransaction";

jest.mock("../api/api");
jest.mock("../network/addresses");
jest.mock("@ledgerhq/logs");
jest.mock("../erc20/tokenAccounts", () => ({
  encodeTxnParams: jest.fn(() => "encodedparams"),
  generateTokenTxnParams: jest.fn(() => "0xabcdef"),
}));
jest.mock("iso-filecoin/message", () => ({
  Message: jest.fn().mockImplementation(() => ({
    serialize: jest.fn(() => Buffer.from("cbor-payload")),
  })),
}));

const mockedFetchEstimatedFees = fetchEstimatedFees as jest.MockedFunction<
  typeof fetchEstimatedFees
>;
const mockedValidateAddress = validateAddress as jest.MockedFunction<typeof validateAddress>;
const mockedIsFilEthAddress = isFilEthAddress as jest.MockedFunction<typeof isFilEthAddress>;
const mockedIsEthereumConvertableAddr = isEthereumConvertableAddr as jest.MockedFunction<
  typeof isEthereumConvertableAddr
>;

const F1_SENDER = "f1sender";
const F1_RECIPIENT = "f1recipient";
const F4_RECIPIENT = "f4recipient";
const CONTRACT = "f4contract";

function makeValidResult(addr: string): ValidateAddressResult {
  return {
    isValid: true,
    parsedAddress: { toString: () => addr } as unknown as ValidateAddressResult extends {
      isValid: true;
    }
      ? ValidateAddressResult["parsedAddress"]
      : never,
  } as unknown as ValidateAddressResult;
}

const NATIVE_INTENT = {
  intentType: "transaction" as const,
  type: "send",
  sender: F1_SENDER,
  recipient: F1_RECIPIENT,
  amount: 100_000_000_000_000_000n,
  asset: { type: "native" as const },
};

describe("craftTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateAddress.mockImplementation(addr => makeValidResult(addr));
    mockedIsFilEthAddress.mockReturnValue(false);
    mockedIsEthereumConvertableAddr.mockReturnValue(false);
    mockedFetchEstimatedFees.mockResolvedValue(
      createMockEstimatedFeesResponse({
        gas_limit: 1_000_000,
        gas_fee_cap: "100000",
        gas_premium: "100000",
        nonce: 5,
      }),
    );
  });

  describe("native FIL transfer", () => {
    it("returns a crafted transaction JSON with CBOR and message fields", async () => {
      const result = await craftTransaction(NATIVE_INTENT);

      expect(typeof result.transaction).toBe("string");
      const parsed = JSON.parse(result.transaction);
      expect(typeof parsed.cbor).toBe("string");
      expect(parsed.signatureType).toBe(1);
      expect(parsed.message.method).toBe(Methods.Transfer);
      expect(parsed.message.value).toBe(NATIVE_INTENT.amount.toString());
      expect(parsed.message.nonce).toBe(5);
      expect(parsed.message.gasLimit).toBe(1_000_000);
    });

    it("uses InvokeEVM method for f4 (delegated ETH) recipient", async () => {
      mockedIsFilEthAddress.mockReturnValue(true);

      const result = await craftTransaction({ ...NATIVE_INTENT, recipient: F4_RECIPIENT });

      const parsed = JSON.parse(result.transaction);
      expect(parsed.message.method).toBe(Methods.InvokeEVM);
    });

    it("respects customFees when provided", async () => {
      const customFees = {
        value: 50_000_000_000n,
        parameters: {
          gasFeeCap: "500000",
          gasPremium: "400000",
          gasLimit: 2_000_000,
          nonce: 10,
        },
      };

      const result = await craftTransaction(NATIVE_INTENT, customFees);
      const parsed = JSON.parse(result.transaction);

      expect(mockedFetchEstimatedFees).not.toHaveBeenCalled();
      expect(parsed.message.gasFeeCap).toBe("500000");
      expect(parsed.message.gasLimit).toBe(2_000_000);
      expect(parsed.message.nonce).toBe(10);
    });
  });

  describe("error cases", () => {
    it("throws on invalid sender address", async () => {
      mockedValidateAddress.mockImplementationOnce(() => ({ isValid: false }));

      await expect(craftTransaction({ ...NATIVE_INTENT, sender: "invalid" })).rejects.toThrow(
        "Invalid sender address",
      );
    });

    it("throws on invalid recipient address", async () => {
      mockedValidateAddress
        .mockImplementationOnce(addr => makeValidResult(addr)) // sender valid
        .mockImplementationOnce(() => ({ isValid: false })); // recipient invalid

      await expect(craftTransaction({ ...NATIVE_INTENT, recipient: "invalid" })).rejects.toThrow(
        "Invalid recipient address",
      );
    });

    it("throws on invalid token contract address", async () => {
      mockedValidateAddress
        .mockImplementationOnce(addr => makeValidResult(addr)) // sender valid
        .mockImplementationOnce(addr => makeValidResult(addr)) // recipient valid
        .mockImplementationOnce(() => ({ isValid: false })); // contract invalid

      const intent = {
        ...NATIVE_INTENT,
        recipient: F4_RECIPIENT,
        asset: { type: "erc20", assetReference: CONTRACT },
      };

      await expect(craftTransaction(intent)).rejects.toThrow("Invalid token contract address");
    });
  });
});
