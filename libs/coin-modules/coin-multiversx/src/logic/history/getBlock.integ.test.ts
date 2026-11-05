/**
 * Integration tests — hit real MultiversX API.
 */
import { ESDT_SYSTEM_SC_BECH32 } from "../../constants";
import { createNetworkApi } from "../../network/api";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";

const API_ENDPOINT = process.env.MULTIVERSX_API_ENDPOINT ?? "https://api.multiversx.com";
const DELEGATION_API_ENDPOINT =
  process.env.MULTIVERSX_DELEGATION_API_ENDPOINT ?? "https://delegation-api.multiversx.com";

const NATIVE = { type: "native" };
const WEGLD_SWAP_CONTRACT = "erd1qqqqqqqqqqqqqpgqhe8t5jewej70zupmh44jurgn29psua5l2jps3ntjj3";

describe("getBlock (integration)", () => {
  const api = createNetworkApi(API_ENDPOINT, DELEGATION_API_ENDPOINT);

  it("returns a cross-shard native transfer with the info of its round", async () => {
    const sender = "erd1qxae079av6p2xnklfkc90tl4kwqk47u0hwwz3mp3gzx2q654zy0scphk9s";
    const receiver = "erd1axqs2gpka9dzkdwj986z3umgusvnlmfejudj9hk0r89l28spgrjq0uuyf6";

    const block = await getBlock(api, 40045794);

    expect(block).toEqual({
      info: { height: 40045794, hash: "40045794", time: new Date(1793796445800) },
      transactions: [
        {
          hash: "6a0399bb1291a58aa9d50cce3c5ac356662b44c765318e235a679e144b90b3e1",
          failed: false,
          operations: [
            { type: "transfer", address: sender, peer: receiver, asset: NATIVE, amount: -1000n },
            { type: "transfer", address: receiver, peer: sender, asset: NATIVE, amount: 1000n },
          ],
          fees: 50000000000000n,
          feesPayer: sender,
        },
      ],
    });
    await expect(getBlockInfo(api, 40045794)).resolves.toEqual(block.info);
  });

  it("returns an ESDT transfer without its gas refund", async () => {
    const sender = "erd1a9tlrg7u4a76ezjaywhpdhskyrj8uw9q9s9jpsl2w2t7vcq0q9tqruwlh8";
    const receiver = "erd16lpzght7h4sqcahsczem8j82gsv6jx8q3rk7rxrccj8guedcapyqwlvzwn";
    const foxsy = {
      type: "esdt",
      assetReference: "FOXSY-5d5f3e",
      assetOwner: ESDT_SYSTEM_SC_BECH32,
    };
    const amount = 6009308686676561142930n;

    const block = await getBlock(api, 40043806);

    expect(block.transactions).toEqual([
      {
        hash: "a33e8eb6a210183ea2f57f6e79111024379874a95c6684f5b81d7ac6b0486294",
        failed: false,
        operations: [
          { type: "transfer", address: sender, peer: receiver, asset: foxsy, amount: -amount },
          { type: "transfer", address: receiver, peer: sender, asset: foxsy, amount },
        ],
        fees: 139000000000000n,
        feesPayer: sender,
      },
    ]);
  });

  it("returns the EGLD sent to a smart contract along with the tokens it minted and sent back", async () => {
    const sender = "erd1uh82qs4wqxkluc2d6pnn4d6javurmnsxqpn9tzx97sjcur3px3gshvnv3q";
    const wegld = {
      type: "esdt",
      assetReference: "WEGLD-bd4d79",
      assetOwner: ESDT_SYSTEM_SC_BECH32,
    };
    const amount = 907211254681927310n;

    const block = await getBlock(api, 40041740);
    const wrap = block.transactions.find(
      tx => tx.hash === "24f39df7291abc7783b609ceee9cbb8cfff596273bb89cba083840053e8a232b",
    );

    expect(wrap).toEqual({
      hash: "24f39df7291abc7783b609ceee9cbb8cfff596273bb89cba083840053e8a232b",
      failed: false,
      operations: [
        {
          type: "transfer",
          address: sender,
          peer: WEGLD_SWAP_CONTRACT,
          asset: NATIVE,
          amount: -amount,
        },
        { type: "transfer", address: WEGLD_SWAP_CONTRACT, peer: sender, asset: NATIVE, amount },
        { type: "transfer", address: WEGLD_SWAP_CONTRACT, asset: wegld, amount },
        {
          type: "transfer",
          address: WEGLD_SWAP_CONTRACT,
          peer: sender,
          asset: wegld,
          amount: -amount,
        },
        { type: "transfer", address: sender, peer: WEGLD_SWAP_CONTRACT, asset: wegld, amount },
      ],
      fees: 83013710000000n,
      feesPayer: sender,
    });
  });

  it("returns every protocol reward of an epoch start round, across pages", async () => {
    const block = await getBlock(api, 39924577);

    expect(block.transactions).toHaveLength(113);
    expect(new Set(block.transactions.map(tx => tx.hash)).size).toBe(113);
    expect(
      block.transactions.find(
        tx => tx.hash === "d107fcce1fa3bc0ec1cbd842a708e96853386d0ebd76f74536d74f55ffe5f984",
      ),
    ).toEqual({
      hash: "d107fcce1fa3bc0ec1cbd842a708e96853386d0ebd76f74536d74f55ffe5f984",
      failed: false,
      operations: [
        {
          type: "transfer",
          address: "erd1dhs0fpvtzggxu27a67hc38kv8ezhl288a5y9xq4292ddft0mt6kqplawwr",
          asset: NATIVE,
          amount: 5280989716299650920n,
        },
      ],
      fees: 0n,
    });
  });
});
