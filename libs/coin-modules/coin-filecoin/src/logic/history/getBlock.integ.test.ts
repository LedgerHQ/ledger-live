import { BlockNotFoundError } from "@ledgerhq/coin-module-framework/errors";
import { filecoinDefaults } from "../../config";
import { createMockFilecoinContext } from "../../test/context";
import { getBlock } from "./getBlock";
import { getBlockInfo } from "./getBlockInfo";

const context = createMockFilecoinContext(filecoinDefaults.filecoin);

// Historical blocks do not change
describe("getBlock (integration)", () => {
  it("returns the transactions of a block, with the same info as getBlockInfo", async () => {
    const { info, transactions } = await getBlock(context, 6557524);

    expect(info).toEqual(await getBlockInfo(context, 6557524));
    expect(transactions).toHaveLength(16);
    expect(transactions.filter(tx => tx.failed)).toHaveLength(2);
  });

  it("returns a native transfer as a signed pair, without the fee", async () => {
    const { transactions } = await getBlock(context, 6557524);

    const tx = transactions.find(
      t => t.hash === "0xc0c761db171e73ead94b36b5d9619bbb6a197583cced47ef8ceae5e178640659",
    );
    expect(tx).toMatchObject({
      failed: false,
      fees: 365510951212n,
      feesPayer: "0xFf000000000000000000000000000000001d5eF4",
    });
    expect(tx?.operations).toEqual([
      {
        type: "transfer",
        address: "0xFf000000000000000000000000000000001d5eF4",
        peer: "0xFF000000000000000000000000000000003b0620",
        asset: { type: "native" },
        amount: -2418951500000000000n,
      },
      {
        type: "transfer",
        address: "0xFF000000000000000000000000000000003b0620",
        peer: "0xFf000000000000000000000000000000001d5eF4",
        asset: { type: "native" },
        amount: 2418951500000000000n,
      },
    ]);
  });

  it("returns the ERC-20 transfers of a transaction", async () => {
    const { transactions } = await getBlock(context, 6557524);

    const tx = transactions.find(
      t => t.hash === "0x824f07b3349615a9afd3cb02e653fbb3cd608db7184924b4861186e7076cf3ce",
    );
    // 3 transfers, 2 operations each
    expect(tx?.operations).toHaveLength(6);
    expect(tx?.operations).toContainEqual({
      type: "transfer",
      address: "0x19962e2591e7e261Eea2E03f4B4eFa332E539072",
      peer: "0x22333879f204379AE4927a457Eb0a1Da9a039416",
      asset: { type: "erc20", assetReference: "0x60e1773636cf5e4a227d9ac24f20feca034ee25a" },
      amount: -100000000000000000000n,
    });
  });

  it("returns every transaction of a block that spans several pages", async () => {
    const { transactions } = await getBlock(context, 6558872);

    expect(transactions).toHaveLength(57);
  });

  it("throws BlockNotFoundError on a null round", async () => {
    await expect(getBlock(context, 6558812)).rejects.toBeInstanceOf(BlockNotFoundError);
  });

  it("throws BlockNotFoundError before the FEVM upgrade", async () => {
    await expect(getBlock(context, 2683340)).rejects.toBeInstanceOf(BlockNotFoundError);
  });
});
