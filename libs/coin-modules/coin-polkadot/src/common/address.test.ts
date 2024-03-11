import { isValidAddress } from "./address";

describe("isValidAddress", () => {
  // This test can be used as a way to validate data test address
  it("returns true with a valid address", () => {
    const address = "16VZ9duXPsEmdBxFtYJRq4bYbZMR7a9dEnSur9CXcnfthrRV";

    const isValid = isValidAddress(address);

    expect(isValid).toBeTruthy();
  });

  it("returns false with a invalid address", () => {
    const address = "ANYTHING";

    const isValid = isValidAddress(address);

    expect(isValid).toBeFalsy();
  });
});
