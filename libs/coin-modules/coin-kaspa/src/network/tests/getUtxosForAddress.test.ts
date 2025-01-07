import { getUtxosForAddresses } from "../index";

interface Outpoint {
  transactionId: string;
  index: number;
}

function getUtxoForOutpoint(utxos: any[], outpoint: Outpoint): any | null {
  for (const utxo of utxos) {
    if (
      utxo.outpoint.transactionId === outpoint.transactionId &&
      utxo.outpoint.index === outpoint.index
    ) {
      return utxo;
    }
  }
  return null;
}

describe("getUtxosForAddress function", () => {
  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    jest.clearAllMocks();
  });
  it("should fetch UTXOs for given address from real API", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
          outpoint: {
            transactionId: "402f0762218346d622bbaeaa25107ab2398733f44f2369c902b176b25fa81e37",
            index: 0,
          },
          utxoEntry: {
            amount: "5000000000000",
            scriptPublicKey: {
              scriptPublicKey:
                "200000000000000000000000000000000000000000000000000000000000000000ac",
            },
            blockDaaScore: "1490933",
            isCoinbase: false,
          },
        },
        {
          address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
          outpoint: {
            transactionId: "6ef083d4a8a1d3cf31a90409f6af5fdc00264c684da80fd3aeb4f6f29684824b",
            index: 0,
          },
          utxoEntry: {
            amount: "5000000000000",
            scriptPublicKey: {
              scriptPublicKey:
                "200000000000000000000000000000000000000000000000000000000000000000ac",
            },
            blockDaaScore: "1491330",
            isCoinbase: false,
          },
        },
        {
          address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
          outpoint: {
            transactionId: "4413257fa1f7884b7cd6f7b42c326da71b45f8c609c3c19609cbf00e5cc66bf4",
            index: 0,
          },
          utxoEntry: {
            amount: "10000000000",
            scriptPublicKey: {
              scriptPublicKey:
                "200000000000000000000000000000000000000000000000000000000000000000ac",
            },
            blockDaaScore: "78211249",
            isCoinbase: false,
          },
        },
      ],
    });
    const addresses = ["kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e"];
    const result = await getUtxosForAddresses(addresses);

    const expectedUtxos = [
      {
        address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
        outpoint: {
          transactionId: "402f0762218346d622bbaeaa25107ab2398733f44f2369c902b176b25fa81e37",
          index: 0,
        },
        utxoEntry: {
          amount: "5000000000000",
          scriptPublicKey: {
            scriptPublicKey: "200000000000000000000000000000000000000000000000000000000000000000ac",
          },
          blockDaaScore: "1490933",
          isCoinbase: false,
        },
      },
      {
        address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
        outpoint: {
          transactionId: "6ef083d4a8a1d3cf31a90409f6af5fdc00264c684da80fd3aeb4f6f29684824b",
          index: 0,
        },
        utxoEntry: {
          amount: "5000000000000",
          scriptPublicKey: {
            scriptPublicKey: "200000000000000000000000000000000000000000000000000000000000000000ac",
          },
          blockDaaScore: "1491330",
          isCoinbase: false,
        },
      },
      {
        address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
        outpoint: {
          transactionId: "4413257fa1f7884b7cd6f7b42c326da71b45f8c609c3c19609cbf00e5cc66bf4",
          index: 0,
        },
        utxoEntry: {
          amount: "10000000000",
          scriptPublicKey: {
            scriptPublicKey: "200000000000000000000000000000000000000000000000000000000000000000ac",
          },
          blockDaaScore: "78211249",
          isCoinbase: false,
        },
      },
    ];

    for (const expectedUtxo of expectedUtxos) {
      const utxoFromResponse = getUtxoForOutpoint(result, {
        transactionId: expectedUtxo.outpoint.transactionId,
        index: 0,
      });

      expect(utxoFromResponse).not.toBeNull();
      expect(utxoFromResponse.address).toEqual(expectedUtxo.address);
      expect(utxoFromResponse.outpoint.transactionId).toEqual(expectedUtxo.outpoint.transactionId);
      expect(utxoFromResponse.outpoint.index).toEqual(expectedUtxo.outpoint.index);
      expect(utxoFromResponse.utxoEntry.amount).toEqual(expectedUtxo.utxoEntry.amount);
      expect(utxoFromResponse.utxoEntry.scriptPublicKey.scriptPublicKey).toEqual(
        expectedUtxo.utxoEntry.scriptPublicKey.scriptPublicKey,
      );
      expect(utxoFromResponse.utxoEntry.blockDaaScore).toEqual(
        expectedUtxo.utxoEntry.blockDaaScore,
      );
      expect(utxoFromResponse.utxoEntry.isCoinbase).toEqual(expectedUtxo.utxoEntry.isCoinbase);
    }
  });

  it("should throw an error if the response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
    });
    const addresses = ["invalidAddress"];
    await expect(getUtxosForAddresses(addresses)).rejects.toThrow();
  });
});
