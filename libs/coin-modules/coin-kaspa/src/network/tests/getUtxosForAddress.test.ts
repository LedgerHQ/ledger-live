import { getUtxosForAddress } from "../indexer-api/getUtxosForAddress";

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
  it("should fetch UTXOs for given address from real API", async () => {
    const address = "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e";
    const result = await getUtxosForAddress(address);

    const expectedUtxos = [
      {
        address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
        outpoint: {
          transactionId: "39bf2bdab5b1abaac847af0d0e892a78a8a8b99f7c996c4a33f4d180457f5f0c",
          index: 0,
        },
        utxoEntry: {
          amount: "5000000000000",
          scriptPublicKey: {
            scriptPublicKey: "200000000000000000000000000000000000000000000000000000000000000000ac",
          },
          blockDaaScore: "1490739",
          isCoinbase: false,
        },
      },
      {
        address: "kaspa:qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqkx9awp4e",
        outpoint: {
          transactionId: "e6de0cd3b55b50a15805945eecc0c5e944564a932a6bb700f880c82a148bbbbf",
          index: 0,
        },
        utxoEntry: {
          amount: "5000000000000",
          scriptPublicKey: {
            scriptPublicKey: "200000000000000000000000000000000000000000000000000000000000000000ac",
          },
          blockDaaScore: "1491002",
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
    const address = "invalidAddress";
    await expect(getUtxosForAddress(address)).rejects.toThrow();
  });
});
