import { encode, decode } from "@ethersproject/rlp";
import { BigNumber } from "bignumber.js";
import type Eth from "./Eth";
import {
  EIP712Message,
  EIP712MessageTypes,
  EIP712MessageTypesEntry,
} from "./types";

export function hexBuffer(str: string): Buffer {
  return Buffer.from(str.startsWith("0x") ? str.slice(2) : str, "hex");
}

export function maybeHexBuffer(
  str: string | null | undefined
): Buffer | null | undefined {
  if (!str) return null;
  return hexBuffer(str);
}

export const decodeTxInfo = (rawTx: Buffer) => {
  const VALID_TYPES = [1, 2];
  const txType = VALID_TYPES.includes(rawTx[0]) ? rawTx[0] : null;
  const rlpData = txType === null ? rawTx : rawTx.slice(1);
  const rlpTx = decode(rlpData).map((hex) => Buffer.from(hex.slice(2), "hex"));
  let chainIdTruncated = 0;
  const rlpDecoded = decode(rlpData);

  let decodedTx;
  if (txType === 2) {
    // EIP1559
    decodedTx = {
      data: rlpDecoded[7],
      to: rlpDecoded[5],
      chainId: rlpTx[0],
    };
  } else if (txType === 1) {
    // EIP2930
    decodedTx = {
      data: rlpDecoded[6],
      to: rlpDecoded[4],
      chainId: rlpTx[0],
    };
  } else {
    // Legacy tx
    decodedTx = {
      data: rlpDecoded[5],
      to: rlpDecoded[3],
      // Default to 1 for non EIP 155 txs
      chainId: rlpTx.length > 6 ? rlpTx[6] : Buffer.from("0x01", "hex"),
    };
  }

  const chainIdSrc = decodedTx.chainId;
  let chainId = new BigNumber(0);
  if (chainIdSrc) {
    // Using BigNumber because chainID could be any uint256.
    chainId = new BigNumber(chainIdSrc.toString("hex"), 16);
    const chainIdTruncatedBuf = Buffer.alloc(4);
    if (chainIdSrc.length > 4) {
      chainIdSrc.copy(chainIdTruncatedBuf);
    } else {
      chainIdSrc.copy(chainIdTruncatedBuf, 4 - chainIdSrc.length);
    }
    chainIdTruncated = chainIdTruncatedBuf.readUInt32BE(0);
  }

  let vrsOffset = 0;
  if (txType === null && rlpTx.length > 6) {
    const rlpVrs = Buffer.from(encode(rlpTx.slice(-3)).slice(2), "hex");

    vrsOffset = rawTx.length - (rlpVrs.length - 1);

    // First byte > 0xf7 means the length of the list length doesn't fit in a single byte.
    if (rlpVrs[0] > 0xf7) {
      // Increment vrsOffset to account for that extra byte.
      vrsOffset++;

      // Compute size of the list length.
      const sizeOfListLen = rlpVrs[0] - 0xf7;

      // Increase rlpOffset by the size of the list length.
      vrsOffset += sizeOfListLen - 1;
    }
  }

  return {
    decodedTx,
    txType,
    chainId,
    chainIdTruncated,
    vrsOffset,
  };
};

/**
 * Helper to convert an integer as a hexadecimal string with the right amount of digits
 * to respect the number of bytes given as parameter
 *
 * @param int Integer
 * @param bytes Number of bytes it should be represented as (1 byte = 2 caraters)
 * @returns The given integer as an hexa string padded with the right number of 0
 */
export const intAsHexBytes = (int: number, bytes: number): string =>
  int.toString(16).padStart(2 * bytes, "0");

/**
 * A Map of helpers to get the wanted binary value for
 * each type of array possible in a type definition
 */
export enum EIP712_ARRAY_TYPE_VALUE {
  DYNAMIC = 0,
  FIXED = 1,
}

/**
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
 * A Map of encoders to transform a value to formatted buffer
 */
export const EIP712_TYPE_ENCODERS = {
  INT(value: number | string | null): Buffer {
    const failSafeValue = value ?? 0;

    if (typeof failSafeValue === "string" && failSafeValue?.startsWith("0x")) {
      return hexBuffer(failSafeValue);
    }

    const valueAsInt =
      typeof failSafeValue === "string"
        ? parseInt(failSafeValue, 10)
        : failSafeValue;

    const valueAsHexString = valueAsInt.toString(16);
    const paddedHexString =
      valueAsHexString.length % 2 ? "0" + valueAsHexString : valueAsHexString;

    return Buffer.from(paddedHexString, "hex");
  },

  UINT(value: number | string): Buffer {
    return this.INT(value);
  },

  BOOL(value: number | string | boolean | null): Buffer {
    return this.INT(typeof value === "boolean" ? Number(value) : value);
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

/**
 * Factory to create the recursive function that will pass on each
 * field level and APDUs to describe its structure implementation
 *
 * @param {Eth["EIP712SendStructImplem"]} EIP712SendStructImplem
 * @param {EIP712MessageTypes} types
 * @returns {void}
 */
export const makeRecursiveFieldStructImplem = (
  EthInstance: Eth,
  types: EIP712MessageTypes
): ((
  destructedType: ReturnType<typeof destructTypeFromString>,
  data: unknown
) => void) => {
  const typesMap = {} as Record<string, Record<string, string>>;
  for (const type in types) {
    typesMap[type] = types[type]?.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: curr.type }),
      {}
    );
  }

  // This recursion will call itself to handle each level of each field
  // in order to send APDUs for each of them
  const recursiveFieldStructImplem = async (
    destructedType: ReturnType<typeof destructTypeFromString>,
    data
  ) => {
    const [typeDescription, arrSizes] = destructedType;
    const [currSize, ...restSizes] = arrSizes;
    const isCustomType =
      !EIP712_TYPE_PROPERTIES[typeDescription?.name?.toUpperCase() || ""];

    if (Array.isArray(data) && typeof currSize !== "undefined") {
      await EthInstance.EIP712SendStructImplem("array", data.length);
      for (const entry of data) {
        await recursiveFieldStructImplem([typeDescription, restSizes], entry);
      }
    } else if (isCustomType) {
      for (const [fieldName, fieldValue] of Object.entries(
        data as EIP712Message["message"]
      )) {
        const fieldType = typesMap?.[typeDescription?.name || ""][fieldName];

        if (fieldType) {
          await recursiveFieldStructImplem(
            destructTypeFromString(fieldType),
            fieldValue
          );
        }
      }
    } else {
      await EthInstance.EIP712SendStructImplem("field", {
        data,
        type: typeDescription?.name || "",
        sizeInBits: typeDescription?.bits,
      });
    }
  };

  return recursiveFieldStructImplem;
};
