import base32Decode from "base32-decode";
import { blake2bInit, blake2bUpdate, blake2bFinal, Blake2bCTX } from "blakejs";
import leb128 from "leb128";
import { log } from "@ledgerhq/logs";

type PrefixObjType = Readonly<{ f: "mainnet" } & { t: "testnet" }>;
type PrefixType = keyof PrefixObjType;

type ProtocolsObjType = Readonly<
  { "0": "ID" } & { "1": "SECP256K1" } & { "2": "Actor" } & {
    "3": "BLS";
  }
>;

type ValidateAddressResult =
  | {
      isValid: true;
      data: {
        protocol: number;
        address: Buffer;
        network: PrefixType;
      };
    }
  | {
      isValid: false;
    };

// Constants
const BASE_64_VARIANT_TYPE: Readonly<"RFC3548"> = "RFC3548";
const SECP256K1_ACTOR_LEN = 20;
const ID_MAX_LEN = 19;
const BLS_MAX_LEN = 48;
const validPrefixs: PrefixObjType = {
  f: "mainnet",
  t: "testnet",
};
const validProtocols: ProtocolsObjType = {
  "0": "ID",
  "1": "SECP256K1",
  "2": "Actor",
  "3": "BLS",
};

export const getAddressRaw = (address: string) => {
  const result = validateAddress(address);

  if (result.isValid) {
    const {
      data: { address, protocol },
    } = result;

    return Buffer.concat([Buffer.from(`0${protocol.toString()}`, "hex"), address]);
  }

  throw new Error("The address is not valid");
};

export const validateAddress = (input: string): ValidateAddressResult => {
  const [prefix, protocol] = input;

  if (!validPrefixs[prefix]) return { isValid: false };
  if (!validProtocols[protocol]) return { isValid: false };

  let newCksum, rcvCksum, addr: Buffer, context: Blake2bCTX;
  const protocolBuf = Buffer.from(`0${protocol.toString()}`, "hex");
  const addrAndCksum = input.substr(2).toUpperCase();

  switch (protocol) {
    case "0":
      log(
        "debug",
        `String Address: ${input} --> Network:${prefix} - Protocol:${protocol} - PkHash:${addrAndCksum.toLowerCase()}`,
      );

      if (addrAndCksum.length > ID_MAX_LEN) return { isValid: false };

      addr = leb128.unsigned.encode(addrAndCksum);
      break;

    case "1":
    case "2":
    case "3":
      [addr, rcvCksum] = splitAddFromCkSum(
        toBuffer(base32Decode(addrAndCksum, BASE_64_VARIANT_TYPE)),
      );

      if ((protocol === "1" || protocol === "2") && addr.length > SECP256K1_ACTOR_LEN)
        return { isValid: false };

      if (protocol === "3" && addr.length > BLS_MAX_LEN) return { isValid: false };

      context = blake2bInit(4);
      blake2bUpdate(context, Buffer.concat([protocolBuf, addr]));
      newCksum = Buffer.from(blake2bFinal(context));

      log(
        "debug",
        `String Address: ${input} --> Network:${prefix} - Protocol:${protocol} - PkHash:${addr.toString(
          "hex",
        )} - CkSum: ${rcvCksum.toString("hex")}`,
      );

      if (rcvCksum.toString("hex") !== newCksum.toString("hex")) return { isValid: false };
      break;

    default:
      return { isValid: false };
  }

  return {
    isValid: true,
    data: {
      network: prefix as PrefixType,
      protocol: parseInt(protocol),
      address: addr,
    },
  };
};

export const splitAddFromCkSum = (addAndCkSum: Buffer): [Buffer, Buffer] => {
  const cksum = addAndCkSum.slice(-4);
  const add = addAndCkSum.slice(0, addAndCkSum.byteLength - 4);
  return [toBuffer(add), toBuffer(cksum)];
};

export const toArrayBuffer = (buf: Buffer): ArrayBuffer => {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
};

export const toBuffer = (ab: ArrayBuffer): Buffer => {
  const buf = Buffer.alloc(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
};
