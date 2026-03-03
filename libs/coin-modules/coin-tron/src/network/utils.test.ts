import BigNumber from "bignumber.js";
import { abiEncodeTrc20Transfer } from "./utils";

describe("abiEncodeTrc20Transfer", () => {
  it("encodes large TRC20 amount without precision loss (uint256 beyond 2^53)", () => {
    const amount = new BigNumber("1000000000000000000000000000");
    const address = "41a614f803b6fd780986a42c78ec9c7f77e6ded13c";
    const encoded = abiEncodeTrc20Transfer(address, amount);
    const amountHex = encoded.slice(-64);
    const decoded = new BigNumber(amountHex, 16);
    expect(decoded).toEqual(amount);
  });
});
