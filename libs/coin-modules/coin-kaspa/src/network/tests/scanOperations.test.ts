import { scanOperations } from "../index";
import expect from "expect";
import { BigNumber } from "bignumber.js";

describe("scan transactions for multiple addresses", () => {
  it("One address", async () => {
    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";

    const result = await scanOperations([address]);
    expect(result.length).toBeGreaterThan(20);

    const exampleTx = result.find(
      res => res.hash === "d3b2d5542d8c943a90b827c4adfe8fe366c8bd8dfb5eb32627cba4b7e9a14ef5"
    );
    expect(exampleTx).toBeDefined();

    expect(exampleTx?.fee.eq(BigNumber(10000))).toBe(true);
    expect(exampleTx?.value.eq(BigNumber(1000000))).toBe(true);

    expect(exampleTx?.type).toBe("IN");
    expect(exampleTx?.senders.length).toBe(1);
    expect(exampleTx?.senders[0]).toBe(
      "kaspa:qr7muv5ywzgjkx6kj20nvp8yes4xg5dxz8dhntkn0jxm4gucuh5d2lv2nh2as"
    );
    expect(exampleTx?.recipients.length).toBe(2);
    expect(exampleTx?.recipients.includes("kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e")).toBe(true);
    expect(exampleTx?.recipients.includes("kaspa:qrhrdg74c6he64ydeevnsxp9c7eu3d0sct2g5rlt3lj7gzyapnl5zzf6spefa")).toBe(true);

    ;
  });
  it("Two addresses", async () => {
    const addresses: string[] = [
      "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
      "kaspa:qqkqkzjvr7zwxxmjxjkmxxdwju9kjs6e9u82uh59z07vgaks6gg62v8707g73"
    ];
    // console.log(new Date().toLocaleString());
    const result = await scanOperations(addresses);
    console.log(result);
    expect(result.length).toBeGreaterThan(20);
    // console.log(new Date().toLocaleString());
  });
});
