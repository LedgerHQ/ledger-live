import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { toReceiveAddressOptions } from "../toReceiveAddressOptions";

const T_ADDR = "t1Rv4exT7bqhZqi2j7xz8bUHDMxwosrjADU";
const Z_ADDR = "u1shieldedaddressexample0000000000000000000000000000";

describe("toReceiveAddressOptions", () => {
  it("offers the account's address alone", () => {
    const receive = mockAccountReceive();

    expect(toReceiveAddressOptions(receive)).toEqual([
      { id: "transparent", address: receive.address, verification: receive.verification },
    ]);
  });

  it("offers the shielded address after the account's, each with its own memo", () => {
    const receive = mockAccountReceive({
      address: T_ADDR,
      verification: undefined,
      shielded: { address: Z_ADDR, memo: { type: "text" } },
    });

    expect(toReceiveAddressOptions(receive)).toEqual([
      { id: "transparent", address: T_ADDR, verification: undefined, memo: undefined },
      { id: "shielded", address: Z_ADDR, memo: { type: "text" } },
    ]);
  });
});
