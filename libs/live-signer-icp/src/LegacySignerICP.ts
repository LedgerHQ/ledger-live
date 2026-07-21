import Transport from "@ledgerhq/hw-transport";
import type {
  ICPAppConfiguration,
  ICPGetAddrResponse,
  ICPSignature,
  ICPSigner,
} from "@ledgerhq/coin-internet_computer/types/signer";
import ICP from "@zondax/ledger-icp";

const SW_OK = 0x9000;

const getPath = (path: string): string =>
  path && !path.startsWith("m/") ? `m/${path}` : path;

const throwOnError = (r: { returnCode: number; errorMessage?: string }): void => {
  if (r.returnCode !== SW_OK) {
    throw new Error(`${r.returnCode} - ${r.errorMessage}`);
  }
};

/**
 * Legacy Internet Computer signer wrapping the third-party `@zondax/ledger-icp`
 * transport. Its responses already match the coin-module `ICPSigner` contract,
 * so they are returned verbatim.
 */
export class LegacySignerICP implements ICPSigner {
  private readonly signer: ICP;

  constructor(transport: Transport) {
    this.signer = new ICP(transport);
  }

  async getAppConfiguration(): Promise<ICPAppConfiguration> {
    const r = await this.signer.getVersion();
    throwOnError(r);
    return {
      version: `${r.major ?? 0}.${r.minor ?? 0}.${r.patch ?? 0}`,
      testMode: !!r.testMode,
      locked: !!r.deviceLocked,
    };
  }

  async showAddressAndPubKey(path: string): Promise<ICPGetAddrResponse> {
    const r = await this.signer.showAddressAndPubKey(getPath(path));
    throwOnError(r);
    return r;
  }

  async getAddressAndPubKey(path: string): Promise<ICPGetAddrResponse> {
    const r = await this.signer.getAddressAndPubKey(getPath(path));
    throwOnError(r);
    return r;
  }

  async sign(path: string, message: Buffer): Promise<ICPSignature> {
    const r = await this.signer.sign(getPath(path), message, 0);
    throwOnError(r);
    return r;
  }
}
