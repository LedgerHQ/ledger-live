import { BigNumber } from "bignumber.js";
import { scanOperations } from "../scanOperations";

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
  it("aggregates operations across many addresses", async () => {
    const addresses: string[] = [
      "kaspa:qr7muv5ywzgjkx6kj20nvp8yes4xg5dxz8dhntkn0jxm4gucuh5d2lv2nh2as",
      "kaspa:qrhrdg74c6he64ydeevnsxp9c7eu3d0sct2g5rlt3lj7gzyapnl5zzf6spefa",
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
      "kaspa:qre7kw0x393sg3w0plmy5x3kpgtct405j7g42tnv2um72z0qynruyrc3d0zcv",
      "kaspa:qpzd6zhske64d0jvxp8kn93h5dfd2j39gj8nzdpt229l30sr8ln9jd2mjzamq",
      "kaspa:qpkq06nnt20gm66cg363uycws75tga4qkq4za4dz5s86zuky6l7m2wsxqy5zw",
      "kaspa:qqcfxdkc60fymkl5cc0fxwnhhh8nth9spsrxcn34j63ktr6nr24n7srpr2zm2",
      "kaspa:qqw80l6g0xwt00q09tlauasxnp9h0vrgwxfly28255j64rt3vvrw6m05pe98j",
      "kaspa:qrukqftcmhffevuszj60l46z7m98kdf7h9cfmtxelufvaf5xfsj86fdjxtmm2",
      "kaspa:qr4pquk0yqcvr5ldpv46stpra3pqrzaywkfn0cn9f7rkcy4xgu7kx03mm5yls",
      "kaspa:qp4laulwqz09qnrw6euysq0ae59mf9nwpkchhsjev9y8pw2f95mt5du6fkpa5",
      "kaspa:qzthpx76mw6206p3ls6j23xxvhjwrd6920djfhdte4tc09v8jqhxgtlqw80xn",
      "kaspa:qpkj88e8008l9j2h40t48570xz3u9l8y06vfqd8pwzsmnunhnd73zls5hdzul",
      "kaspa:qrhluzyhy2n5u57z7f4jn4n2fjwjcd86ewge3j9h8dvtel2c8ldmwcvylp4hc",
      "kaspa:qz6k0pz8shqd4zfpmqpspl6j0purdhwq0xy2h8serqw07cppshflcr3mhe248",
      "kaspa:qrckwt9rumxx8r7qnhaec50jjzun70nt7z5gp6jzce0x6ce7q4trvd9h2de7h",
      "kaspa:qpxd49lqfsm8xc7h8zfrq7hsepuhyxcv7rjw7uh8zdarptsphglvwyft86lq0",
      "kaspa:qqazyredarlyecvyu4hajf93rm2h7psnne9zdjdfte30z9kusmakyfqzqwejh",
      "kaspa:qr75stkhe6wwylvnhr0209j2s628ljhm2mcd98xwxtny00wt8k25slr377s42",
      "kaspa:qz02cr63rr5q5c255gym9h8wyh35nx55kzj5vsecesnnlmkx30tw50xmqx68x",
      "kaspa:qpd79h3q5n44vtnnv453vdag0jjreswm7j4n7yn9pk6z02xres0w7xtq89vcp",
      "kaspa:qrea9nx96khcenx7s7getyt383xxtp2tnqha6hckkfx2hnscrtse6kkgt5smq",
      "kaspa:qzjaa4cvngeggxppvceee23tvn45888gxs9qsye26ktmjphcfmtfsmmhl7qn5",
      "kaspa:qzuac7efd533gcrdlg9wlghagv78r0v6hr3ww5n0sknzvw6ultlpssvpw5lnp",
      "kaspa:qz3qzsg08w8eczkyn9nqcc3wvdh800cq6ef6capn5etrc78qu0m2s2tz2neqe",
      "kaspa:qpanxyfr78fx8pm5wxvsu6zjfe8gagm4nw4v38rucfqtjerclly0jdyxc0et3",
      "kaspa:qzl478lkwhmtdm779weq56grykxlljauz2rwrcclwm5zy3qwzxxa2km4nl66f",
      "kaspa:qrxlupzem0vag3nps4x7msza47kxc97fhr6kac00qwj5nhd7tqadve053e37q",
      "kaspa:qzfgltqxy8wxle0mnsalq05tg8wp5gecn0uzjm4v2ynhxdnch6fg74qsns7nz",
      "kaspa:qqvwyszx9yf457pqyywx0754cspvjsuyrgay756qeq45nzjewljrvrjr9xpke",
      "kaspa:qr9e9pncm8lr7t0pr3nx0xswf8l6afme92crt52c5y5mmz9fa4utg9ta8m80p",
    ];

    const result = await scanOperations(addresses, "");

    expect(result.length).toBeGreaterThan(5);

    // both addresses in outputs
    expect(result.flatMap(res => res.recipients)).toEqual(
      expect.arrayContaining([addresses[0], addresses[1]]),
    );
  }, 120000);
});
