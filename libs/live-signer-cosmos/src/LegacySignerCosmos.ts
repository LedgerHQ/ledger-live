import {
  CosmosAddress,
  CosmosGetAddressAndPubKeyRes,
  CosmosSignature,
  CosmosSigner,
} from "@ledgerhq/coin-cosmos/types/signer";
import Cosmos from "@ledgerhq/hw-app-cosmos";
import Transport from "@ledgerhq/hw-transport";
import { CosmosApp } from "@zondax/ledger-cosmos-js";

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
    return this.signer.getAddressAndPubKey(path, hrp, boolDisplay);
  }

  async sign(path: number[], buffer: Buffer, transactionType?: string): Promise<CosmosSignature> {
    return this.signer.sign(path, buffer, transactionType);
  }

  async getAddress(path: string, hrp: string, boolDisplay?: boolean): Promise<CosmosAddress> {
    return this.hwSigner.getAddress(path, hrp, boolDisplay);
  }
}
