import { validateAddress as networkValidateAddress } from "../network/addresses";
import type { ValidateAddressResult } from "../network/addresses";
import { validateAddress } from "./validateAddress";

jest.mock("../network/addresses");

const mockedNetworkValidateAddress = networkValidateAddress as jest.MockedFunction<
  typeof networkValidateAddress
>;

describe("validateAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when network validation returns isValid:true", async () => {
    mockedNetworkValidateAddress.mockReturnValueOnce({
      isValid: true,
      parsedAddress: {} as unknown as ValidateAddressResult extends { isValid: true }
        ? ValidateAddressResult["parsedAddress"]
        : never,
    } as unknown as ValidateAddressResult);

    const result = await validateAddress("f1someaddress", {});

    expect(result).toBe(true);
    expect(mockedNetworkValidateAddress).toHaveBeenCalledWith("f1someaddress");
  });

  it("returns false when network validation returns isValid:false", async () => {
    mockedNetworkValidateAddress.mockReturnValueOnce({ isValid: false });

    const result = await validateAddress("not-valid", {});

    expect(result).toBe(false);
  });

  it("ignores the parameters argument", async () => {
    mockedNetworkValidateAddress.mockReturnValueOnce({ isValid: true } as ValidateAddressResult);

    await validateAddress("f1addr", { currencyId: "filecoin" });

    expect(mockedNetworkValidateAddress).toHaveBeenCalledWith("f1addr");
  });
});
