import { MerkleMap } from "./merkleMap";
import { PsbtV2 } from "./psbtv2";

/**
 * This class merkelizes a PSBTv2, by merkelizing the different
 * maps of the psbt. This is used during the transaction signing process,
 * where the hardware app can request specific parts of the psbt from the
 * client code and be sure that the response data actually belong to the psbt.
 * The reason for this is the limited amount of memory available to the app,
 * so it can't always store the full psbt in memory.
 *
 * The signing process is documented at
 * https://github.com/LedgerHQ/app-bitcoin-new/blob/master/doc/bitcoin.md#sign_psbt
 */
export class MerkelizedPsbt extends PsbtV2 {
  public globalMerkleMap: MerkleMap;
  public inputMerkleMaps: MerkleMap[] = [];
  public outputMerkleMaps: MerkleMap[] = [];
  public inputMapCommitments: Buffer[];
  public outputMapCommitments: Buffer[];
  constructor(psbt: PsbtV2) {
    super();
    psbt.copy(this);
    this.globalMerkleMap = MerkelizedPsbt.createMerkleMap(this.globalMap);

    for (let i = 0; i < this.getGlobalInputCount(); i++) {
      this.inputMerkleMaps.push(MerkelizedPsbt.createMerkleMap(this.inputMaps[i]));
    }
    this.inputMapCommitments = [...this.inputMerkleMaps.values()].map(v => v.commitment());

    for (let i = 0; i < this.getGlobalOutputCount(); i++) {
      this.outputMerkleMaps.push(MerkelizedPsbt.createMerkleMap(this.outputMaps[i]));
    }
    this.outputMapCommitments = [...this.outputMerkleMaps.values()].map(v => v.commitment());
  }
  // These public functions are for MerkelizedPsbt.
  getGlobalSize(): number {
    return this.globalMap.size;
  }
  getGlobalKeysValuesRoot(): Buffer {
    return this.globalMerkleMap.commitment();
  }

  private static createMerkleMap(map: Map<string, Buffer>): MerkleMap {
    const sortedKeysStrings = [...map.keys()].sort();
    const values = sortedKeysStrings.map(k => {
      const v = map.get(k);
      if (!v) {
        throw new Error("No value for key " + k);
      }
      return v;
    });
    const sortedKeys = sortedKeysStrings.map(k => Buffer.from(k, "hex"));

    const merkleMap = new MerkleMap(sortedKeys, values);
    return merkleMap;
  }
}
