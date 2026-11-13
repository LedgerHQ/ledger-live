import coinConfig, { cosmosDefaults } from "../../config";
import { CosmosAPI } from "../../network/Cosmos";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";

const HEIGHT = 33721701;
const MSG_SEND_HASH = "69FA03588DDD5D61DEA9A47CD51EC4E02921174E24C2A81610124BBA7131F51D";
const MSG_RECV_PACKET_HASH = "90E8A303E4AA540B4A635FD16EC75C8EC754E22B05BE21D2D785E523BD9F31B5";

describe("getBlock (integ, Cosmos Hub)", () => {
  coinConfig.setCoinConfig(() => cosmosDefaults.cosmos);
  const api = new CosmosAPI("cosmos", undefined, cosmosDefaults.cosmos);
  const config = cosmosDefaults.cosmos;

  it("returns the transactions of a historical block", async () => {
    const block = await getBlock(config, api, HEIGHT);

    expect(block.transactions.map(tx => tx.hash)).toEqual([MSG_RECV_PACKET_HASH, MSG_SEND_HASH]);
    expect(block.transactions[1]).toEqual({
      hash: MSG_SEND_HASH,
      failed: false,
      fees: 3629n,
      feesPayer: "cosmos16exhyvwyy82fnavqgupf67lku4jvvd82h7p20u",
      operations: [
        {
          type: "transfer",
          address: "cosmos16exhyvwyy82fnavqgupf67lku4jvvd82h7p20u",
          peer: "cosmos16na4yg4rtt4n8j72n54uy5mvxn7f08l7t4h3xv",
          asset: { type: "native" },
          amount: -202952273n,
        },
        {
          type: "transfer",
          address: "cosmos16na4yg4rtt4n8j72n54uy5mvxn7f08l7t4h3xv",
          peer: "cosmos16exhyvwyy82fnavqgupf67lku4jvvd82h7p20u",
          asset: { type: "native" },
          amount: 202952273n,
        },
      ],
    });
    expect(block.transactions[0]).toEqual(
      expect.objectContaining({ hash: MSG_RECV_PACKET_HASH, failed: false, fees: 1840n }),
    );
  });

  it("returns the same block info as getBlockInfo", async () => {
    const block = await getBlock(config, api, HEIGHT);

    expect(block.info).toEqual(await getBlockInfo(api, HEIGHT));
  });

  it("returns the same block whatever the pagination limit", async () => {
    const paged = await getBlock(
      { ...config, getBlock: { pagination: { limit: 1 }, concurrency: 2 } },
      api,
      HEIGHT,
    );

    expect(paged).toEqual(await getBlock(config, api, HEIGHT));
    expect(paged.transactions.map(tx => tx.hash)).toEqual([MSG_RECV_PACKET_HASH, MSG_SEND_HASH]);
  });

  it("rejects a height above the chain length", async () => {
    await expect(getBlock(config, api, 999999999)).rejects.toMatchObject({
      name: "GetBlockError",
      message: expect.stringContaining("Failed to get block 999999999: "),
      cause: expect.objectContaining({ message: expect.stringContaining("invalid height") }),
    });
  });

  it("rejects an invalid height", async () => {
    await expect(getBlock(config, api, 0)).rejects.toMatchObject({
      name: "GetBlockError",
      message: "Failed to get block 0: Invalid block height: 0",
      cause: expect.objectContaining({ name: "InvalidParameterError" }),
    });
  });
});
