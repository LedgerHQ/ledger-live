import { BigNumber } from "bignumber.js";
import { AccountAddresses } from "../../types";
import { parseExtendedPublicKey } from "../kaspaAddresses";
import { scanAddresses } from "../scanAddresses";

describe("scanAddresses function", () => {
  it("Gets information about addresses being active or not", async () => {
    const xpub =
      "410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563";
    const { compressedPublicKey, chainCode } = parseExtendedPublicKey(Buffer.from(xpub, "hex"));

    const accountAddresses: AccountAddresses = await scanAddresses(
      compressedPublicKey,
      chainCode,
      0,
    );

    const sumBalance = accountAddresses.usedReceiveAddresses
      .reduce((acc, v) => acc.plus(v.balance), BigNumber(0))
      .plus(
        accountAddresses.usedChangeAddresses.reduce((acc, v) => acc.plus(v.balance), BigNumber(0)),
      );

    expect(accountAddresses.usedReceiveAddresses.length).toBeGreaterThan(0);
    expect(accountAddresses.totalBalance.eq(sumBalance)).toBe(true);
  }, 10000);
});
