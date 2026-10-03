import { BigNumber } from "bignumber.js";
import { scanOperations } from "../history/scanOperations";

describe("scan transactions for multiple addresses", () => {
  it("One address", async () => {
    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";

    const result = await scanOperations([address], "");
    expect(result.length).toBeGreaterThan(20);

    const exampleTx = result.find(
      res => res.hash === "d3b2d5542d8c943a90b827c4adfe8fe366c8bd8dfb5eb32627cba4b7e9a14ef5",
    );

    expect(exampleTx).toMatchObject({
      fee: BigNumber(10000),
      value: BigNumber(1000000),
      type: "IN",
      senders: ["kaspa:qr7muv5ywzgjkx6kj20nvp8yes4xg5dxz8dhntkn0jxm4gucuh5d2lv2nh2as"],
      recipients: [
        "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
        "kaspa:qrhrdg74c6he64ydeevnsxp9c7eu3d0sct2g5rlt3lj7gzyapnl5zzf6spefa",
      ],
    });

    // it's a burn address, so it's definetly an IN-operation
    result.slice(0, 50).forEach(tx => {
      expect(tx.type).toBe("IN");
    });
  });
  it("Two addresses", async () => {
    const addresses: string[] = [
      "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
      "kaspa:qqkqkzjvr7zwxxmjxjkmxxdwju9kjs6e9u82uh59z07vgaks6gg62v8707g73",
    ];
    const result = await scanOperations(addresses, "");

    expect(result.length).toBeGreaterThan(20);

    // both addresses in outputs
    expect(result.flatMap(res => res.recipients)).toEqual(expect.arrayContaining(addresses));
  });
  // 10 addresses: enough for two FETCH_CONCURRENCY (5) batches, so results are aggregated across
  // concurrent fetches. It used to be 200, i.e. 200+ history requests in one burst — enough to keep the
  // endpoint's rate limiter (HTTP 429) engaged past every retry.
  it("aggregates operations across many addresses", async () => {
    const addresses: string[] = [
      "kaspa:qq82f9sdsqqkr74memhxt9yrefc8vq9khf5vt6xjp4tscc3pdenmks29mlp9y",
      "kaspa:qqq7n4n232754kgw6jeu4zu86uerwn4kq9lnl2n2prwl3t2t9hvec720vk9s2",
      "kaspa:qpc6twj20gxqpeyxvgqe3v4y2ng8t0tawfax89jkf8f24wazmcreu9ggw3crl",
      "kaspa:qp09jt0gh9qmhymfyqpga38avm098nm5j2x4uz4kfxs6kyv6u0qg6z09uknmw",
      "kaspa:qphv6h6e0dv605j2vz6rwgj0e28fh4nupssfyq3msaex6w7y3gh0kny8rwhrp",
      "kaspa:qrp78nf43jaz3zk0j4dxga4ncdzk95xhun95hp6scyh6g6z7kwugy02wfw6ee",
      "kaspa:qrkacr4jtl8fznhre26rttuprqj9kz02ntks9v8gftm2ms5qjqnwqmdjhf4z7",
      "kaspa:qzu2meys866jtsl48h6wu99j9s90t8u0ednp3pwhcmmdyttdufusjsr3l2tsz",
      "kaspa:qr8ng05d4s46ayggcv9mvaxr0x8yqpv5ztw969zfye59xemp3ph4vazqt693p",
      "kaspa:qqv6t7vvgkk6nfpruwttqnfxhjn65xxdd8vjxw5nkq5zkncps6e6x33880l4r",
    ];

    const result = await scanOperations(addresses, "");

    expect(result.length).toBeGreaterThan(5);

    // both addresses in outputs
    expect(result.flatMap(res => res.recipients)).toEqual(
      expect.arrayContaining([addresses[0], addresses[1]]),
    );
  }, 120000);
});
