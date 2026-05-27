import { fetchEstimatedFees } from "../api/api";
import { validateAddress } from "../network/addresses";
import type { ValidateAddressResult } from "../network/addresses";
import { createMockEstimatedFeesResponse } from "../test/fixtures";
import { getNextSequence } from "./getNextSequence";

jest.mock("../api/api");
jest.mock("../network/addresses");

const mockedFetchEstimatedFees = fetchEstimatedFees as jest.MockedFunction<
  typeof fetchEstimatedFees
>;
const mockedValidateAddress = validateAddress as jest.MockedFunction<typeof validateAddress>;

const VALID_ADDRESS = "f1someaddress";

describe("getNextSequence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedValidateAddress.mockReturnValue({
      isValid: true,
      parsedAddress: { toString: () => VALID_ADDRESS } as unknown as ValidateAddressResult extends {
        isValid: true;
      }
        ? ValidateAddressResult["parsedAddress"]
        : never,
    } as unknown as ValidateAddressResult);
  });

  it("returns nonce as bigint from fee estimation response", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(
      createMockEstimatedFeesResponse({ nonce: 42 }),
    );

    const result = await getNextSequence(VALID_ADDRESS);

    expect(result).toBe(42n);
  });

  it("calls fetchEstimatedFees with the validated address", async () => {
    mockedFetchEstimatedFees.mockResolvedValueOnce(createMockEstimatedFeesResponse());

    await getNextSequence(VALID_ADDRESS);

    expect(mockedFetchEstimatedFees).toHaveBeenCalledWith(
      expect.objectContaining({ from: VALID_ADDRESS }),
    );
  });

  it("throws on invalid address", async () => {
    mockedValidateAddress.mockReturnValueOnce({ isValid: false });

    await expect(getNextSequence("not-a-valid-address")).rejects.toThrow("Invalid address");
  });
});
