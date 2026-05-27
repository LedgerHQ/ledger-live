import { fetchEstimatedFees } from "../api/api";
import {
  validateAddress,
  isRecipientValidForTokenTransfer,
} from "../network/addresses";
import type { ValidateAddressResult } from "../network/addresses";
import { createMockEstimatedFeesResponse } from "../test/fixtures";
import { validateIntent } from "./validateIntent";

jest.mock("../api/api");
jest.mock("../network/addresses");
jest.mock("@ledgerhq/logs");

const mockedFetchEstimatedFees = fetchEstimatedFees as jest.MockedFunction<
  typeof fetchEstimatedFees
>;
const mockedValidateAddress = validateAddress as jest.MockedFunction<typeof validateAddress>;
const mockedIsRecipientValidForTokenTransfer =
  isRecipientValidForTokenTransfer as jest.MockedFunction<typeof isRecipientValidForTokenTransfer>;

const SENDER = "f1sender";
const RECIPIENT = "f1recipient";

const ONE_FIL = 1_000_000_000_000_000_000n;

const NATIVE_INTENT = {
  intentType: "transaction" as const,
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 100_000_000_000_000_000n,
  asset: { type: "native" as const },
};

const NATIVE_BALANCE = [
  {
    value: ONE_FIL,
    asset: { type: "native" as const },
    locked: 0n,
  },
];

const FEE_RESPONSE = createMockEstimatedFeesResponse({
  gas_limit: 1_000_000,
  gas_fee_cap: "100",
  gas_premium: "80",
  nonce: 1,
});

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

describe("validateIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateAddress.mockImplementation(addr => makeValidResult(addr));
    mockedIsRecipientValidForTokenTransfer.mockReturnValue(true);
    mockedFetchEstimatedFees.mockResolvedValue(FEE_RESPONSE);
  });

  describe("native FIL transfer", () => {
    it("returns no errors for a valid intent with sufficient balance", async () => {
      const result = await validateIntent(NATIVE_INTENT, NATIVE_BALANCE);

      expect(result.errors).toEqual({});
      expect(result.warnings).toEqual({});
      expect(result.amount).toBe(NATIVE_INTENT.amount);
    });

    it("returns RecipientRequired when recipient is empty", async () => {
      const result = await validateIntent({ ...NATIVE_INTENT, recipient: "" }, NATIVE_BALANCE);

      expect(result.errors["recipient"]).toBeInstanceOf(Error);
    });

    it("returns InvalidAddress when recipient fails address validation", async () => {
      // validateIntent checks recipient first, then sender
      mockedValidateAddress
        .mockImplementationOnce(() => ({ isValid: false })) // 1st call: recipient → invalid
        .mockImplementationOnce(addr => makeValidResult(addr)); // 2nd call: sender → valid

      const result = await validateIntent(
        { ...NATIVE_INTENT, recipient: "bad-address" },
        NATIVE_BALANCE,
      );

      expect(result.errors["recipient"]).toBeInstanceOf(Error);
    });

    it("returns AmountRequired when amount is 0 and useAllAmount is false", async () => {
      const result = await validateIntent({ ...NATIVE_INTENT, amount: 0n }, NATIVE_BALANCE);

      expect(result.errors["amount"]).toBeInstanceOf(Error);
    });

    it("returns NotEnoughBalance when totalSpent exceeds balance", async () => {
      const result = await validateIntent(
        { ...NATIVE_INTENT, amount: ONE_FIL * 2n },
        NATIVE_BALANCE,
      );

      expect(result.errors["amount"]).toBeInstanceOf(Error);
    });

    it("uses customFees when provided, skipping fee estimation", async () => {
      const customFees = {
        value: 50_000_000n,
        parameters: { gasFeeCap: "50", gasLimit: 1_000_000, gasPremium: "40", nonce: 2 },
      };

      await validateIntent(NATIVE_INTENT, NATIVE_BALANCE, customFees);

      expect(mockedFetchEstimatedFees).not.toHaveBeenCalled();
    });

    it("computes useAllAmount correctly (amount = spendable - fees)", async () => {
      const result = await validateIntent(
        { ...NATIVE_INTENT, useAllAmount: true, amount: 0n },
        NATIVE_BALANCE,
      );

      const expectedFees = BigInt(FEE_RESPONSE.gas_fee_cap) * BigInt(FEE_RESPONSE.gas_limit);
      expect(result.amount).toBe(ONE_FIL - expectedFees);
      expect(result.errors).toEqual({});
    });
  });

  describe("invalid sender", () => {
    it("returns error for invalid sender address", async () => {
      // validateIntent checks recipient first, then sender
      mockedValidateAddress
        .mockImplementationOnce(addr => makeValidResult(addr)) // 1st call: recipient → valid
        .mockImplementationOnce(() => ({ isValid: false })); // 2nd call: sender → invalid

      const result = await validateIntent({ ...NATIVE_INTENT, sender: "bad" }, NATIVE_BALANCE);

      expect(result.errors["sender"]).toBeInstanceOf(Error);
    });
  });
});
