import BigEndian from "./BigEndian";
import { crypto } from "./Crypto";
import { TLV } from "./tlv";

export class PubKeyCredential {
  version: number;
  curveId: number;
  signAlgorithm: number;
  publicKey: Uint8Array;

  constructor({
    version,
    curveId,
    signAlgorithm,
    publicKey,
  }: {
    version: number;
    curveId: number;
    signAlgorithm: number;
    publicKey: Uint8Array;
  }) {
    this.version = version;
    this.curveId = curveId;
    this.signAlgorithm = signAlgorithm;
    this.publicKey = publicKey;
  }

  static fromBytes(data, offset = 0): [PubKeyCredential, number] {
    const view = new DataView(data.buffer, data.byteOffset + offset);
    const version = view.getUint8(0);
    const curveId = view.getUint8(1);
    const signAlgorithm = view.getUint8(2);
    const publicKeyLength = view.getUint8(3);
    const publicKey = new Uint8Array(data.buffer, data.byteOffset + offset + 4, publicKeyLength);

    return [
      new PubKeyCredential({
        version,
        curveId,
        signAlgorithm,
        publicKey,
      }),
      4 + publicKeyLength,
    ];
  }

  toBytes(): Uint8Array {
    const result = new Uint8Array(4 + this.publicKey.length);
    const view = new DataView(result.buffer);
    view.setUint8(0, this.version);
    view.setUint8(1, this.curveId);
    view.setUint8(2, this.signAlgorithm);
    view.setUint8(3, this.publicKey.length);
    result.set(this.publicKey, 4);
    return result;
  }

  toJSON() {
    return {
      version: this.version,
      curveId: this.curveId,
      signAlgorithm: this.signAlgorithm,
      publicKey: crypto.to_hex(this.publicKey),
    };
  }

  assertValidity() {
    if (this.version !== 0x00) {
      throw new Error(`PubKeyCredential: Wrong version: ${this.version}`);
    }
    if (this.curveId !== 0x21) {
      throw new Error(`PubKeyCredential: Wrong curve id: ${this.curveId}`);
    }
    if (this.signAlgorithm !== 0x01) {
      throw new Error(`PubKeyCredential: Wrong sign algorithm: ${this.signAlgorithm}`);
    }
    if (this.publicKey.length !== 0x21) {
      throw new Error(`PubKeyCredential: Wrong pubkey len: ${this.publicKey.length}`);
    }
  }
}

export type SemVer = {
  major: number;
  minor: number;
  patch: number;
};

export class Challenge {
  payloadType: number;
  version: number;
  protocolVersion: SemVer;
  challengeData: Uint8Array;
  challengeExpiry: Date;
  host: string;
  rpCredential: PubKeyCredential;
  rpSignature: Uint8Array;

  constructor({
    payloadType,
    version,
    protocolVersion,
    challengeData,
    challengeExpiry,
    host,
    rpCredential,
    rpSignature,
  }: {
    payloadType: number;
    version: number;
    protocolVersion: SemVer;
    challengeData: Uint8Array;
    challengeExpiry: Date;
    host: string;
    rpCredential: PubKeyCredential;
    rpSignature: Uint8Array;
  }) {
    this.payloadType = payloadType;
    this.version = version;
    this.protocolVersion = protocolVersion;
    this.challengeData = challengeData;
    this.challengeExpiry = challengeExpiry;
    this.host = host;
    this.rpCredential = rpCredential;
    this.rpSignature = rpSignature;
  }

  static fromBytes(data: Uint8Array, offset = 0): [Challenge, number] {
    let index = offset;
    const all = TLV.readAllTLV(data, offset);
    const byType: Record<number, Uint8Array | undefined> = {};
    for (const tlv of all) {
      index += tlv.value.length + 2;
      byType[tlv.type] = tlv.value;
      // console.log(tlv.type.toString(16), "(" + tlv.value.length + ")", crypto.to_hex(tlv.value));
    }

    const payloadTypeField = byType[0x01];
    if (payloadTypeField === undefined) {
      throw new Error("Missing payloadType");
    }
    const payloadType = payloadTypeField[0];

    const versionField = byType[0x02];
    if (versionField === undefined) {
      throw new Error("Missing version");
    }
    const version = versionField[0];

    const protocolVersionField = byType[0x60];
    if (protocolVersionField === undefined) {
      throw new Error("Missing protocolVersion");
    }
    const protocolVersion = {
      major: protocolVersionField[0],
      minor: protocolVersionField[1],
      patch: protocolVersionField[2],
    };

    const challengeDataField = byType[0x12];
    if (challengeDataField === undefined) {
      throw new Error("Missing challengeData");
    }
    const challengeData = challengeDataField;

    const challengeExpiryField = byType[0x16];
    if (challengeExpiryField === undefined) {
      throw new Error("Missing challengeExpiry");
    }
    const challengeExpiry = new Date(1000 * BigEndian.arrayToNumber(challengeExpiryField));

    const hostField = byType[0x20];
    if (hostField === undefined) {
      throw new Error("Missing host");
    }
    const host = new TextDecoder().decode(hostField);

    const signAlgorithmField = byType[0x14];
    if (signAlgorithmField === undefined) {
      throw new Error("Missing signAlgorithm");
    }
    const signAlgorithm = signAlgorithmField[0];

    const publicKey = byType[0x33];
    if (publicKey === undefined) {
      throw new Error("Missing rpCredential");
    }

    const curveIdField = byType[0x32];
    if (curveIdField === undefined) {
      throw new Error("Missing curveId");
    }
    const curveId = curveIdField[0];

    const rpCredential = new PubKeyCredential({
      version,
      curveId,
      signAlgorithm,
      publicKey,
    });

    const rpSignatureField = byType[0x15];
    if (rpSignatureField === undefined) {
      throw new Error("Missing rpSignature");
    }
    const rpSignature = rpSignatureField;

    const challenge = new Challenge({
      payloadType,
      protocolVersion,
      version,
      challengeData,
      challengeExpiry,
      host,
      rpCredential,
      rpSignature,
    });

    return [challenge, index - offset];
  }

  toBytes(): Uint8Array {
    let buffer = new Uint8Array();

    buffer = TLV.pushTLV(buffer, 0x01, 1, new Uint8Array([this.payloadType]));
    buffer = TLV.pushTLV(buffer, 0x02, 1, new Uint8Array([this.version]));
    buffer = TLV.pushTLV(buffer, 0x12, this.challengeData.length, this.challengeData);
    buffer = TLV.pushTLV(buffer, 0x14, 1, new Uint8Array([this.rpCredential.signAlgorithm]));
    buffer = TLV.pushTLV(buffer, 0x15, this.rpSignature.length, this.rpSignature);
    buffer = TLV.pushTLV(buffer, 0x16, 4, BigEndian.numberToArray(this.getChallengeExpireValue()));
    buffer = TLV.pushTLV(buffer, 0x20, this.host.length, new TextEncoder().encode(this.host));
    buffer = TLV.pushTLV(buffer, 0x32, 1, new Uint8Array([this.rpCredential.curveId]));
    buffer = TLV.pushTLV(
      buffer,
      0x33,
      this.rpCredential.publicKey.length,
      this.rpCredential.publicKey,
    );
    const data = this.getProtocolVersionData();
    buffer = TLV.pushTLV(buffer, 0x60, data.length, data);

    return buffer;
  }

  getUnsignedTLV(): Uint8Array {
    let buffer = new Uint8Array();
    buffer = TLV.pushTLV(buffer, 0x01, 1, new Uint8Array([this.payloadType]));
    buffer = TLV.pushTLV(buffer, 0x02, 1, new Uint8Array([this.version]));
    buffer = TLV.pushTLV(buffer, 0x12, this.challengeData.length, this.challengeData);
    buffer = TLV.pushTLV(buffer, 0x16, 4, BigEndian.numberToArray(this.getChallengeExpireValue()));
    buffer = TLV.pushTLV(buffer, 0x20, this.host.length, new TextEncoder().encode(this.host));
    const data = this.getProtocolVersionData();
    buffer = TLV.pushTLV(buffer, 0x60, data.length, data);
    return buffer;
  }

  toJSON() {
    return {
      payloadType: this.payloadType,
      version: this.version,
      protocolVersion: this.protocolVersion,
      challenge: {
        data: crypto.to_hex(this.challengeData),
        expiry: this.challengeExpiry.toISOString(),
      },
      host: this.host,
      rp: [
        {
          credential: this.rpCredential.toJSON(),
          signature: crypto.to_hex(this.rpSignature),
        },
      ],
    };
  }

  getProtocolVersionData(): Uint8Array {
    return new Uint8Array([
      this.protocolVersion.major,
      this.protocolVersion.minor,
      this.protocolVersion.patch,
      0,
    ]);
  }

  getChallengeExpireValue(): number {
    return Math.floor(this.challengeExpiry.getTime() / 1000);
  }
}

export type SeedIdResult = {
  pubkeyCredential: PubKeyCredential;
  signature: Uint8Array;
  attestationType: number;
  attestationPubkeyCredential: PubKeyCredential;
  attestation: Uint8Array;
  attestationResult: Uint8Array;
};

export function parseSeedIdResult(result: Uint8Array): SeedIdResult {
  let offset = 0;
  const [pubkeyCredential, pubkeyCredentialLength] = PubKeyCredential.fromBytes(result, offset);
  pubkeyCredential.assertValidity();

  offset += pubkeyCredentialLength;

  const signatureLen = result[offset];
  offset += 1;

  const signature = new Uint8Array(result.buffer, result.byteOffset + offset, signatureLen);

  offset += signatureLen;

  const attestationResult = new Uint8Array(result.slice(offset));

  const attestationType = result[offset];
  offset += 1;

  const [attestationPubkeyCredential, attestationPubkeyCredentialLength] =
    PubKeyCredential.fromBytes(result, offset);

  attestationPubkeyCredential.assertValidity();

  offset += attestationPubkeyCredentialLength;

  const attestationLen = result[offset];
  offset += 1;

  const attestation = new Uint8Array(result.buffer, result.byteOffset + offset, attestationLen);

  return {
    pubkeyCredential,
    signature,
    attestationType,
    attestationPubkeyCredential,
    attestation,
    attestationResult,
  };
}
