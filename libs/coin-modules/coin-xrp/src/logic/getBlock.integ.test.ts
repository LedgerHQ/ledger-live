import coinConfig, { XrpCoinConfig } from "../config";
import { getBlock } from "./getBlock";

let originalGetCoinConfig: () => XrpCoinConfig;

describe("getBlock", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(
      () =>
        ({
          node: "https://s.altnet.rippletest.net:51234",
        }) as XrpCoinConfig,
    );
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("should fetch and parse block 14263654 correctly", async () => {
    const block = await getBlock(14263654);

    expect(block.info).toStrictEqual({
      hash: "10046BD9355CCDAE762C82D5FA59B5DC536E465119FCEFA941C2DD6E6BD155FD",
      height: 14263654,
      parent: {
        hash: "DAE7F19542D6F87678681E8E7A65D6EBDC522E4338F38932B0444752E6BBCC25",
        height: 14263653,
      },
      time: new Date("2026-01-22T17:46:21.000Z"),
    });

    expect(block.info.height).toBe(14263654);
    expect(block.info.hash).toBe(
      "10046BD9355CCDAE762C82D5FA59B5DC536E465119FCEFA941C2DD6E6BD155FD",
    );
    expect(block.transactions.length).toBe(2);

    const tx0 = block.transactions[0];
    expect(tx0.failed).toBe(false);
    expect(tx0.fees).toBe(12n);
    expect(tx0.feesPayer).toBe("rPbS9E67Gn1srVFgvj9LV9LwV83kLFyA4q");

    expect(tx0.hash).toBe("7B9AFECF2D53B40251A72F4FD35685A3CA9CADE1D86C4F54EFC8310331CA0BEE");

    expect(Array.isArray(tx0.operations)).toBe(true);
    const expectedOps = [
      {
        type: "transfer" as const,
        address: "rPbS9E67Gn1srVFgvj9LV9LwV83kLFyA4q",
        amount: -999000000n,
        asset: {
          type: "native",
          name: "XRP",
        },
      },
      {
        type: "transfer" as const,
        address: "refV71jPdVAK3vQQb77SQrCJ2ibbov2H8",
        amount: 999000000n,
        asset: {
          type: "native",
          name: "XRP",
        },
      },
    ];

    expect(tx0.operations).toEqual(expect.arrayContaining(expectedOps));
  });
});
