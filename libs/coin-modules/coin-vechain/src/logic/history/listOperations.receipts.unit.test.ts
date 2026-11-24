import { VTHO_ADDRESS } from "@vechain/sdk-core";
import { createMockVechainContext } from "../../test/context";
import { listOperations } from "./listOperations";

const ADDRESS = "0x0fe6688548f0c303932bb197b0a96034f1d74dba";
const TX = "0x5fdd7191c4d476a8e86060d516366e87421f65667b9b3c14c33a740c04921b10";
const META = {
  blockID: "0xblock",
  blockNumber: 150,
  blockTimestamp: 1_700_000_000,
  txID: TX,
  txOrigin: "0xcf130b42ae31c4931298b4b1c0f1d974b8732957",
  clauseIndex: 0,
};

let receipt: Record<string, unknown>;
const receiptRequests: string[] = [];

jest.mock("@ledgerhq/live-network", () => async (args: { url: string }) => {
  if (args.url.endsWith("/blocks/best")) return { data: { number: 200 } };
  if (args.url.endsWith("/logs/transfer")) {
    return {
      data: [{ sender: META.txOrigin, recipient: ADDRESS, amount: "0x64", meta: META }],
    };
  }
  if (args.url.endsWith("/logs/event")) {
    return {
      data: [
        {
          address: VTHO_ADDRESS,
          topics: [
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
            "0x000000000000000000000000cf130b42ae31c4931298b4b1c0f1d974b8732957",
            "0x0000000000000000000000000fe6688548f0c303932bb197b0a96034f1d74dba",
          ],
          data: "0x0000000000000000000000000000000000000000000000008ac7230489e80000",
          meta: META,
        },
      ],
    };
  }
  if (args.url.endsWith("/receipt")) {
    receiptRequests.push(args.url);
    return { data: receipt };
  }
  throw new Error(`unexpected request ${args.url}`);
});

describe("listOperations fee from the receipt", () => {
  const context = createMockVechainContext();

  beforeEach(() => {
    receiptRequests.length = 0;
  });

  it("reads one receipt for the VET and VTHO operations of a transaction, and reports its gas payer", async () => {
    receipt = { paid: "0x1c6bf52634000", gasPayer: "0xsponsor", meta: { txOrigin: META.txOrigin } };

    const { items } = await listOperations(context, ADDRESS, { minHeight: 0 });

    expect(receiptRequests).toHaveLength(1);
    expect(items.map(({ asset, tx }) => [asset.type, tx.fees, tx.feesPayer])).toEqual([
      ["native", BigInt("0x1c6bf52634000"), "0xsponsor"],
      ["token", BigInt("0x1c6bf52634000"), "0xsponsor"],
    ]);
  });

  it("falls back to the transaction origin when the receipt names no gas payer", async () => {
    receipt = { paid: "0x1c6bf52634000", meta: { txOrigin: META.txOrigin } };

    const { items } = await listOperations(context, ADDRESS, { minHeight: 0 });

    expect(items.map(({ tx }) => tx.feesPayer)).toEqual([META.txOrigin, META.txOrigin]);
  });

  it("reports a fee of 0 the receipt states", async () => {
    receipt = { paid: "0x0", gasPayer: "0xsponsor" };

    const { items } = await listOperations(context, ADDRESS, { minHeight: 0 });

    expect(items.map(({ tx }) => tx.fees)).toEqual([0n, 0n]);
  });

  it.each([
    ["no receipt", null],
    ["a receipt without a fee", { gasPayer: "0xsponsor" }],
  ])("fails rather than report a fee of 0 when the node returns %s", async (_, response) => {
    receipt = response as Record<string, unknown>;

    await expect(listOperations(context, ADDRESS, { minHeight: 0 })).rejects.toThrow(
      `vechain: no fee in the receipt of transaction ${TX}`,
    );
  });
});
