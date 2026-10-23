import { IDL } from "@icp-sdk/core/candid";
import { decodeCanisterIdlFunc } from "./candid";

const func = IDL.Func([], [IDL.Nat64], ["query"]);

describe("decodeCanisterIdlFunc", () => {
  it("decodes a reply held in a view at a nonzero offset", () => {
    const reply = IDL.encode([IDL.Nat64], [42n]);
    const message = new Uint8Array(reply.length + 3);
    message.set(reply, 3);

    expect(decodeCanisterIdlFunc(func, message.subarray(3))).toEqual([42n]);
  });
});
