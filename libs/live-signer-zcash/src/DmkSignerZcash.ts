import type {
  ZcashAppConfig,
  ZcashAddress,
  ZcashViewKey,
  ZcashTrustedInput,
  ZcashSigner,
  ZcashSignerEvent,
} from "@ledgerhq/zcash-shielded/signer";
import { SignerZcash, SignerZcashBuilder } from "@ledgerhq/device-signer-kit-zcash";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";

export class DmkSignerZcash implements ZcashSigner {
  private readonly signer: SignerZcash;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerZcashBuilder({ dmk, sessionId }).build();
  }

  async getAppConfig(): Promise<ZcashAppConfig> {
    throw new Error("Not implemented");
  }

  async getAddress(_path: string, _display?: boolean): Promise<ZcashAddress> {
    throw new Error("Not implemented");
  }

  async getViewKey(_path: string): Promise<ZcashViewKey> {
    throw new Error("Not implemented");
  }

  async getTrustedInput(): Promise<ZcashTrustedInput> {
    throw new Error("Not implemented");
  }

  async signTransaction(_path: string, _rawTxHex: string): Promise<ZcashSignerEvent> {
    throw new Error("Not implemented");
  }

  async signMessage(_path: string, _rawTxHex: string): Promise<ZcashSignerEvent> {
    throw new Error("Not implemented");
  }
}
