import {
  CosmosAddress,
  CosmosGetAddressAndPubKeyRes,
  CosmosSignature,
  CosmosSigner,
} from "@ledgerhq/coin-cosmos/types/signer";
import Cosmos from "@ledgerhq/hw-app-cosmos";
import Transport from "@ledgerhq/hw-transport";
import CosmosApp from "@zondax/ledger-cosmos-js";

const SW_OK = 0x9000;
const HARDENED_DEPTH = 3;

function getReturnCode(error: unknown): number | undefined {
  if (typeof error === "object" && error !== null && "returnCode" in error) {
    const { returnCode } = error;
    return typeof returnCode === "number" ? returnCode : undefined;
  }
  return undefined;
}

// Matches the purpose'/coin'/account'/change/index layout that ledger-cosmos-js 3.x derived from number[].
function toBip32Path(path: number[]): string {
  return `m/${path.map((child, i) => (i < HARDENED_DEPTH ? `${child}'` : `${child}`)).join("/")}`;
}

export class LegacySignerCosmos implements CosmosSigner {
  private readonly signer: CosmosApp;
  private readonly hwSigner: Cosmos;

  constructor(transport: Transport) {
    this.signer = new CosmosApp(transport);
    this.hwSigner = new Cosmos(transport);
  }

  async getAddressAndPubKey(
    path: number[],
    hrp: string,
    boolDisplay?: boolean,
  ): Promise<CosmosGetAddressAndPubKeyRes> {
    const bip32Path = toBip32Path(path);
    const { bech32_address, compressed_pk } = boolDisplay
      ? await this.signer.showAddressAndPubKey(bip32Path, hrp)
      : await this.signer.getAddressAndPubKey(bip32Path, hrp);
    return {
      bech32_address,
      compressed_pk: compressed_pk as unknown as string,
      return_code: SW_OK,
      error_message: "",
    };
  }

  // 4.x throws on device status words, but callers branch on return_code (expert mode, refusal).
  async sign(path: number[], buffer: Buffer, hrp?: string): Promise<CosmosSignature> {
    try {
      const { signature } = await this.signer.sign(toBip32Path(path), buffer, hrp);
      return { signature, return_code: SW_OK };
    } catch (e) {
      const returnCode = getReturnCode(e);
      if (returnCode === undefined) throw e;
      return { signature: null, return_code: returnCode };
    }
  }

  async getAddress(path: string, hrp: string, boolDisplay?: boolean): Promise<CosmosAddress> {
    return this.hwSigner.getAddress(path, hrp, boolDisplay);
  }
}
