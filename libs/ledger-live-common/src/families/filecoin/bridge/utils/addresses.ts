import blake from "blakejs";
import base32Decode from "base32-decode";
import BN from "bn.js";

import leb from "leb128";

export type ValidateAddressResult =
  | {
      isValid: true;
      bytes: Buffer;
    }
  | {
      isValid: false;
    };

export const ProtocolIndicator = {
  ID: 0,
  SECP256K1: 1,
  ACTOR: 2,
  BLS: 3,
  DELEGATED: 4,
};

export const validateAddress = (input: string): ValidateAddressResult => {
  try {
    const bytes = addressAsBytes(input);
    return { isValid: true, bytes };
  } catch (error) {
    return { isValid: false };
  }
};

function getChecksum(payload: Buffer): Buffer {
  const blakeCtx = blake.blake2bInit(4);
  blake.blake2bUpdate(blakeCtx, payload);
  return Buffer.from(blake.blake2bFinal(blakeCtx));
}

function addressAsBytes(address: string): Buffer {
  let address_decoded, payload, checksum;
  const protocolIndicator = address[1];
  const protocolIndicatorByte = `0${protocolIndicator}`;

  switch (Number(protocolIndicator)) {
    case ProtocolIndicator.ID:
      if (address.length > 18) {
        throw new Error("invalid payload length");
      }
      return Buffer.concat([
        Buffer.from(protocolIndicatorByte, "hex"),
        Buffer.from(leb.unsigned.encode(address.substr(2))),
      ]);
    case ProtocolIndicator.SECP256K1:
      address_decoded = base32Decode(address.slice(2).toUpperCase(), "RFC4648");

      payload = address_decoded.slice(0, -4);
      checksum = Buffer.from(address_decoded.slice(-4));

      if (payload.byteLength !== 20) {
        throw new Error("invalid payload length");
      }
      break;
    case ProtocolIndicator.ACTOR:
      address_decoded = base32Decode(address.slice(2).toUpperCase(), "RFC4648");

      payload = address_decoded.slice(0, -4);
      checksum = Buffer.from(address_decoded.slice(-4));

      if (payload.byteLength !== 20) {
        throw new Error("invalid payload length");
      }
      break;
    case ProtocolIndicator.BLS:
      address_decoded = base32Decode(address.slice(2).toUpperCase(), "RFC4648");

      payload = address_decoded.slice(0, -4);
      checksum = Buffer.from(address_decoded.slice(-4));

      if (payload.byteLength !== 48) {
        throw new Error("invalid payload length");
      }
      break;
    case ProtocolIndicator.DELEGATED:
      return delegatedAddressAsBytes(address);
    default:
      throw new Error("invalid protocol indicator");
  }

  const bytes_address = Buffer.concat([
    Buffer.from(protocolIndicatorByte, "hex"),
    Buffer.from(payload),
  ]);

  if (getChecksum(bytes_address).toString("hex") !== checksum.toString("hex")) {
    throw new Error("invalid checksum");
  }

  return bytes_address;
}

function delegatedAddressAsBytes(address: string): Buffer {
  const protocolIndicator = address[1];

  const namespaceRaw = address.slice(2, address.indexOf("f", 2));
  const subAddressRaw = address.slice(address.indexOf("f", 2) + 1);
  const address_decoded = base32Decode(subAddressRaw.toUpperCase(), "RFC4648");

  const namespaceBuff = new BN(namespaceRaw, 10).toBuffer("be", 8);
  const namespaceBytes = Buffer.from(leb.unsigned.encode(namespaceBuff));
  const protocolBytes = Buffer.from(leb.unsigned.encode(protocolIndicator));
  const bytes_address = Buffer.concat([
    protocolBytes,
    namespaceBytes,
    Buffer.from(address_decoded.slice(0, -4)),
  ]);
  const checksum = Buffer.from(address_decoded.slice(-4));

  if (getChecksum(bytes_address).toString("hex") !== checksum.toString("hex")) {
    throw new Error("invalid checksum");
  }

  return bytes_address;
}
