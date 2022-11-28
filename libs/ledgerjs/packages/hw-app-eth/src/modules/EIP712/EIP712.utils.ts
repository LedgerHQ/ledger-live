import axios from "axios";
import SHA224 from "crypto-js/sha224";
import { hexBuffer, intAsHexBytes } from "../../utils";
import {
  EIP712Message,
  EIP712MessageTypesEntry,
  MessageFilters,
} from "./EIP712.types";
import EIP712CAL from "@ledgerhq/cryptoassets/data/eip712";
import BigNumber from "bignumber.js";

const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * @ignore for the README
 *
 * A Map of helpers to get the wanted binary value for
 * each type of array possible in a type definition
 */
enum EIP712_ARRAY_TYPE_VALUE {
  DYNAMIC = 0,
  FIXED = 1,
}

/**
 * @ignore for the README
 *
 * A Map of helpers to get the id and size to return for each
 * type that can be used in EIP712
 */
export const EIP712_TYPE_PROPERTIES: Record<
  string,
  {
    key: (size?: number) => number;
    sizeInBits: (size?: number) => number | null;
  }
> = {
  CUSTOM: {
    key: () => 0,
    sizeInBits: () => null,
  },
  INT: {
    key: () => 1,
    sizeInBits: (size) => Number(size) / 8,
  },
  UINT: {
    key: () => 2,
    sizeInBits: (size) => Number(size) / 8,
  },
  ADDRESS: {
    key: () => 3,
    sizeInBits: () => null,
  },
  BOOL: {
    key: () => 4,
    sizeInBits: () => null,
  },
  STRING: {
    key: () => 5,
    sizeInBits: () => null,
  },
  BYTES: {
    key: (size) => (typeof size !== "undefined" ? 6 : 7),
    sizeInBits: (size) => (typeof size !== "undefined" ? Number(size) : null),
  },
};

/**
 * @ignore for the README
 *
 * A Map of encoders to transform a value to formatted buffer
 */
export const EIP712_TYPE_ENCODERS = {
  INT(value: string | null, sizeInBits = 256): Buffer {
    const failSafeValue = value ?? "0";

    if (typeof failSafeValue === "string" && failSafeValue?.startsWith("0x")) {
      return hexBuffer(failSafeValue);
    }

    let valueAsBN = new BigNumber(failSafeValue);
    // If negative we'll use `two's complement` method to
    // "reversibly convert a positive binary number into a negative binary number with equivalent (but negative) value".
    // thx wikipedia
    if (valueAsBN.lt(0)) {
      const sizeInBytes = sizeInBits / 8;
      // Creates BN from a buffer serving as a mask filled by maximum value 0xff
      const maskAsBN = new BigNumber(
        `0x${Buffer.alloc(sizeInBytes, 0xff).toString("hex")}`
      );

      // two's complement version of value
      valueAsBN = maskAsBN.plus(valueAsBN).plus(1);
    }

    const paddedHexString =
      valueAsBN.toString(16).length % 2
        ? "0" + valueAsBN.toString(16)
        : valueAsBN.toString(16);

    return Buffer.from(paddedHexString, "hex");
  },

  UINT(value: string): Buffer {
    return this.INT(value);
  },

  BOOL(value: number | string | boolean | null): Buffer {
    return this.INT(
      typeof value === "boolean" ? Number(value).toString() : value
    );
  },

  ADDRESS(value: string | null): Buffer {
    // Only sending the first 10 bytes (why ?)
    return hexBuffer(value ?? "").slice(0, 20);
  },

  STRING(value: string | null): Buffer {
    return Buffer.from(value ?? "", "utf-8");
  },

  BYTES(value: string | null, sizeInBits?: number): Buffer {
    const failSafeValue = value ?? "";
    // Why slice again ?
    return hexBuffer(failSafeValue).slice(
      0,
      sizeInBits ?? (failSafeValue?.length - 2) / 2
    );
  },
};

/**
 * @ignore for the README
 *
 * Helper parsing an EIP712 Type name to return its type and size(s)
 * if it's an array or nested arrays
 *
 * @see EIP712MessageTypes
 *
 * @example "uint8[2][][4]" => [{name: "uint", bits: 8}, [2, null, 4]]
 * @example "bool" => [{name: "bool", bits: null}, []]
 *
 * @param {String} typeName
 * @returns {[{ name: string; bits: Number | null }, Array<Number | null | undefined>]}
 */
export const destructTypeFromString = (
  typeName?: string
): [
  { name: string; bits: number | undefined } | null,
  Array<number | null>
] => {
  // Will split "any[][1][10]" in "any", "[][1][10]"
  const splitNameAndArraysRegex = new RegExp(/^([^[\]]*)(\[.*\])*/g);
  // Will match all numbers (or null) inside each array. [0][10][] => [0,10,null]
  const splitArraysRegex = new RegExp(/\[(\d*)\]/g);
  // Will separate the the name from the potential bits allocation. uint8 => [uint,8]
  const splitNameAndNumberRegex = new RegExp(/(\D*)(\d*)/);

  const [, type, maybeArrays] =
    splitNameAndArraysRegex.exec(typeName || "") || [];
  const [, name, bits] = splitNameAndNumberRegex.exec(type || "") || [];
  const typeDescription = name
    ? { name, bits: bits ? Number(bits) : undefined }
    : null;

  const arrays = maybeArrays ? [...maybeArrays.matchAll(splitArraysRegex)] : [];
  // Parse each size to either a Number or null
  const arraySizes = arrays.map(([, size]) => (size ? Number(size) : null));

  return [typeDescription, arraySizes];
};

/**
 * @ignore for the README
 *
 * Helper to construct the hexadecimal ByteString for the description
 * of a field in an EIP712 Message
 *
 * @param isArray
 * @param typeSize
 * @param typeValue
 * @returns {String} HexByteString
 */
export const constructTypeDescByteString = (
  isArray: boolean,
  typeSize: number | null | undefined,
  typeValue: number
): string => {
  if (typeValue >= 16) {
    throw new Error(
      "Eth utils - constructTypeDescByteString - Cannot accept a typeValue >= 16 because the typeValue can only be 4 bits in binary" +
        { isArray, typeSize, typeValue }
    );
  }
  // 1 is array, 0 is not array
  const isArrayBit = isArray ? "1" : "0";
  // 1 has type size, 0 has no type size
  const hasTypeSize = typeof typeSize === "number" ? "1" : "0";
  // 2 unused bits
  const unusedBits = "00";
  // type key as 4 bits
  const typeValueBits = typeValue.toString(2).padStart(4, "0");

  return intAsHexBytes(
    parseInt(isArrayBit + hasTypeSize + unusedBits + typeValueBits, 2),
    1
  );
};

/**
 * @ignore for the README
 *
 * Helper to create the buffer to describe an EIP712 types' entry structure
 *
 * @param {EIP712MessageTypesEntry} entry
 * @returns {Buffer}
 */
export const makeTypeEntryStructBuffer = ({
  name,
  type,
}: EIP712MessageTypesEntry): Buffer => {
  const [typeDescription, arrSizes] = destructTypeFromString(type as string);
  const isTypeAnArray = Boolean(arrSizes.length);
  const typeProperties =
    EIP712_TYPE_PROPERTIES[typeDescription?.name?.toUpperCase() || ""] ||
    EIP712_TYPE_PROPERTIES.CUSTOM;

  const typeKey = typeProperties.key(typeDescription?.bits);
  const typeSizeInBits = typeProperties.sizeInBits(typeDescription?.bits);

  const typeDescData = constructTypeDescByteString(
    isTypeAnArray,
    typeSizeInBits,
    typeKey
  );

  const bufferArray: Buffer[] = [Buffer.from(typeDescData, "hex")];

  if (typeProperties === EIP712_TYPE_PROPERTIES.CUSTOM) {
    bufferArray.push(
      Buffer.from(intAsHexBytes(typeDescription?.name?.length ?? 0, 1), "hex")
    );
    bufferArray.push(Buffer.from(typeDescription?.name ?? "", "utf-8"));
  }

  if (typeof typeSizeInBits === "number") {
    bufferArray.push(Buffer.from(intAsHexBytes(typeSizeInBits, 1), "hex"));
  }

  if (isTypeAnArray) {
    bufferArray.push(Buffer.from(intAsHexBytes(arrSizes.length, 1), "hex"));

    arrSizes.forEach((size) => {
      if (typeof size === "number") {
        bufferArray.push(
          Buffer.from(intAsHexBytes(EIP712_ARRAY_TYPE_VALUE.FIXED, 1), "hex"),
          Buffer.from(intAsHexBytes(size, 1), "hex")
        );
      } else {
        bufferArray.push(
          Buffer.from(intAsHexBytes(EIP712_ARRAY_TYPE_VALUE.DYNAMIC, 1), "hex")
        );
      }
    });
  }

  bufferArray.push(
    Buffer.from(intAsHexBytes(name.length, 1), "hex"),
    Buffer.from(name, "utf-8")
  );

  return Buffer.concat(bufferArray);
};

// As defined in [spec](https://eips.ethereum.org/EIPS/eip-712), the properties below are all required.
export function isEIP712Message(
  message: Record<string, unknown> | string
): message is EIP712Message {
  return (
    typeof message === "object" &&
    "types" in message &&
    "primaryType" in message &&
    "domain" in message &&
    "message" in message
  );
}

export const sortObjectAlphabetically = (
  obj: Record<string, any>
): Record<string, any> => {
  const keys = Object.keys(obj).sort();

  return keys.reduce((acc, curr) => {
    const value = (() => {
      if (Array.isArray(obj[curr])) {
        return obj[curr].map((field) =>
          sortObjectAlphabetically(field as Record<string, any>)
        );
      }
      return obj[curr];
    })();

    acc[curr] = value;
    return acc;
  }, {});
};

export const getSchemaHashForMessage = (message: EIP712Message): string => {
  const { types } = message;
  const sortedTypes = sortObjectAlphabetically(types);

  return SHA224(JSON.stringify(sortedTypes).replace(" ", "")).toString();
};

/**
 * @ignore for the README
 *
 * Tries to find the proper filters for a given EIP712 message
 * in the CAL
 *
 * @param {EIP712Message} message
 * @returns {MessageFilters | undefined}
 */
export const getFiltersForMessage = async (
  message: EIP712Message,
  remoteCryptoAssetsListURI?: string | null
): Promise<MessageFilters | undefined> => {
  const schemaHash = getSchemaHashForMessage(message);
  const messageId = `${message.domain?.chainId ?? 0}:${
    message.domain?.verifyingContract ?? NULL_ADDRESS
  }:${schemaHash}`;

  try {
    if (remoteCryptoAssetsListURI) {
      const { data: dynamicCAL } = await axios.get<
        Record<string, MessageFilters>
      >(`${remoteCryptoAssetsListURI}/eip712.json`);
      return dynamicCAL[messageId] || EIP712CAL[messageId];
    }
    throw new Error();
  } catch (e) {
    return EIP712CAL[messageId];
  }
};
