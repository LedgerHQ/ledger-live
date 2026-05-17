import { isValidAddress } from "../common";
import { validateAddress } from "./validateAddress";

jest.mock("../common", () => ({
  ...jest.requireActual("../common"),
  isValidAddress: jest.fn(),
}));

describe("validateAddress", () => {
  const mockedIsValidAddress = jest.mocked(isValidAddress);

  beforeEach(() => {
    mockedIsValidAddress.mockClear();
  });

  it.each([true, false])(
    "should call isValidAddress and return expected value (%s)",
    async (expectedValue: boolean) => {
      mockedIsValidAddress.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(mockedIsValidAddress).toHaveBeenCalledTimes(1);
      // validateAddress now passes the resolved ss58Format as the second argument.
      // With no currencyId in parameters, the default prefix (0) is used.
      expect(mockedIsValidAddress).toHaveBeenCalledWith(address, 0);
    },
  );

  it("passes ss58Format=42 for bittensor", async () => {
    mockedIsValidAddress.mockReturnValueOnce(true);
    const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    await validateAddress(address, { currencyId: "bittensor" });
    expect(mockedIsValidAddress).toHaveBeenCalledWith(address, 42);
  });

  it("passes ss58Format=42 for westend", async () => {
    mockedIsValidAddress.mockReturnValueOnce(true);
    const address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
    await validateAddress(address, { currencyId: "westend" });
    expect(mockedIsValidAddress).toHaveBeenCalledWith(address, 42);
  });

  it("passes ss58Format=0 for polkadot", async () => {
    mockedIsValidAddress.mockReturnValueOnce(true);
    const address = "16VZ9duXPsEmdBxFtYJRq4bYbZMR7a9dEnSur9CXcnfthrRV";
    await validateAddress(address, { currencyId: "polkadot" });
    expect(mockedIsValidAddress).toHaveBeenCalledWith(address, 0);
  });
});
