import { Identity, Signature } from "@dfinity/agent";
import ICP from "@zondax/ledger-icp";
import { Principal } from "@dfinity/principal";
import { ResponseSign } from "@zondax/ledger-icp";
import { bufferToArrayBuffer } from "./utils";

export class LedgerIdentity implements Identity {
  protected principal: Principal;
  protected derivePath: string;
  protected pubkeyBuf: Buffer;
  protected transport: any;

  constructor(
    principalText: string,
    derivePath: string,
    pubKey: Buffer,
    transport: any
  ) {
    this.principal = Principal.fromText(principalText);
    this.derivePath = derivePath;
    this.pubkeyBuf = pubKey;

    this.transport = transport;
  }

  public getPrincipal(): Principal {
    return this.principal;
  }

  public async sign(blob: ArrayBuffer) {
    const app = new ICP(this.transport);

    const resp: ResponseSign = await app.sign(
      this.derivePath,
      Buffer.from(blob),
      0
    );

    const signatureRS = resp.signatureRS;
    if (!signatureRS) {
      throw new Error(
        `A ledger error happened during signature:\n` +
        `Code: ${resp.returnCode}\n` +
        `Message: ${JSON.stringify(resp.errorMessage)}\n`
      );
    }

    if (signatureRS?.byteLength !== 64) {
      throw new Error(
        `Signature must be 64 bytes long (is ${signatureRS.length})`
      );
    }

    return bufferToArrayBuffer(signatureRS) as Signature;
  }

  public async transformRequest() { }
}
