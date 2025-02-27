import coinConfig from "../config";
import { combine } from "./combine";
import { decodeTransaction } from "./utils";

describe("combine", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "http://localhost",
      },
    }));
  });

  it("combines in a local way the rawTx and its signature (so it can be used easily in the broadcast)", () => {
    // GIVEN
    const rawTx =
      "0a020ee522082e5fc67747a428af40f0e2ace4d3325a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541fd49eda0f23ff7ec1d03b52c3a45991c24cd440e12154198927ffb9f554dc4a453c64b2e553a02d6df514b18e80770fd9ca9e4d332";
    const signature = "0B7E480C202D77F02E84C4E86A4CEF2D44623E670F455558C6FA8F09F5715E66";

    // WHEN
    const result = combine(rawTx, signature);

    // THEN
    const txLength = parseInt(result.slice(0, 4), 16);
    expect(txLength).toEqual(rawTx.length);
    expect(result.slice(4, txLength + 4)).toEqual(rawTx);
    expect(result.slice(4 + txLength).length).toEqual(64);
    expect(result.slice(4 + txLength)).toEqual(signature);
  });
});

describe("decodeTransaction", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "http://localhost",
      },
    }));
  });

  it("creates a transaction in TronWeb format", async () => {
    const result = await decodeTransaction(
      "0a020ee522082e5fc67747a428af40f0e2ace4d3325a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541fd49eda0f23ff7ec1d03b52c3a45991c24cd440e12154198927ffb9f554dc4a453c64b2e553a02d6df514b18e80770fd9ca9e4d332",
    );

    expect(result).toEqual({
      // visible: true,
      txID: "477eaebbf508f7e2030f52917d34d264cfef5764d7f73eda582708e5762ceb25",
      raw_data: {
        contract: [
          {
            parameter: {
              value: {
                amount: 1000,
                owner_address: "41fd49eda0f23ff7ec1d03b52c3a45991c24cd440e",
                to_address: "4198927ffb9f554dc4a453c64b2e553a02d6df514b",
              },
              type_url: "type.googleapis.com/protocol.TransferContract",
            },
            type: "TransferContract",
          },
        ],
        ref_block_bytes: "0ee5",
        ref_block_hash: "2e5fc67747a428af",
        expiration: 1740477510000,
        timestamp: 1740477451901,
      },
      raw_data_hex:
        "0a020ee522082e5fc67747a428af40f0e2ace4d3325a66080112620a2d747970652e676f6f676c65617069732e636f6d2f70726f746f636f6c2e5472616e73666572436f6e747261637412310a1541fd49eda0f23ff7ec1d03b52c3a45991c24cd440e12154198927ffb9f554dc4a453c64b2e553a02d6df514b18e80770fd9ca9e4d332",
    });
  });
});
