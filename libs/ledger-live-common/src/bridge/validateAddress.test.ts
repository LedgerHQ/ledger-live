import * as validateAddress from "./validateAddress";

describe("validateAddress", () => {
  const spiedIsInvalidRecipient = jest.spyOn(validateAddress, "isInvalidRecipient");

  beforeEach(() => {
    spiedIsInvalidRecipient.mockClear();
  });

  it.each([true, false])(
    "should call isInvalidRecipient and return expected value (%s)",
    async (expectedValue: boolean) => {
      spiedIsInvalidRecipient.mockReturnValueOnce(expectedValue);

      const address = "some random address";
      const parameters = {};
      const result = await validateAddress.validateAddress(address, parameters);
      expect(result).toEqual(expectedValue);

      expect(spiedIsInvalidRecipient).toHaveBeenCalledTimes(1);
      expect(spiedIsInvalidRecipient).toHaveBeenCalledWith(address);
    },
  );
});
