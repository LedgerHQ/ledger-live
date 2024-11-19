import BigNumber from "bignumber.js";
import Transport from "@ledgerhq/hw-transport";
import { EIP712Message, EIP712MessageTypesEntry } from "@ledgerhq/types-live";
import { getValueFromPath } from "@ledgerhq/evm-tools/message/index";
import { MessageFilters } from "@ledgerhq/evm-tools/message/EIP712/types";
import { hexBuffer, intAsHexBytes } from "../../utils";
import { FilteringInfoShowField } from "./types";

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
    size: (size?: number) => number | null;
  }
> = {
  CUSTOM: {
    key: () => 0,
    size: () => null,
  },
  INT: {
    key: () => 1,
    size: size => Number(size) / 8,
  },
  UINT: {
    key: () => 2,
    size: size => Number(size) / 8,
  },
  ADDRESS: {
    key: () => 3,
    size: () => null,
  },
  BOOL: {
    key: () => 4,
    size: () => null,
  },
  STRING: {
    key: () => 5,
    size: () => null,
  },
  BYTES: {
    key: size => (typeof size !== "undefined" ? 6 : 7),
    size: size => (typeof size !== "undefined" ? Number(size) : null),
  },
};

/**
 * @ignore for the README
 *
 * A Map of encoders to transform a value to formatted buffer
 */
export const EIP712_TYPE_ENCODERS = {
  INT(value: string | null, size = 256): Buffer {
    const failSafeValue = value ?? "0";

    if (typeof failSafeValue === "string" && failSafeValue?.startsWith("0x")) {
      return hexBuffer(failSafeValue);
    }

    let valueAsBN = new BigNumber(failSafeValue);
    // If negative we'll use `two's complement` method to
    // "reversibly convert a positive binary number into a negative binary number with equivalent (but negative) value".
    // thx wikipedia
    if (valueAsBN.lt(0)) {
      const sizeInBytes = size / 8;
      // Creates BN from a buffer serving as a mask filled by maximum value 0xff
      const maskAsBN = new BigNumber(`0x${Buffer.alloc(sizeInBytes, 0xff).toString("hex")}`);

      // two's complement version of value
      valueAsBN = maskAsBN.plus(valueAsBN).plus(1);
    }

    const paddedHexString =
      valueAsBN.toString(16).length % 2 ? "0" + valueAsBN.toString(16) : valueAsBN.toString(16);

    return Buffer.from(paddedHexString, "hex");
  },

  UINT(value: string): Buffer {
    return this.INT(value);
  },

  BOOL(value: number | string | boolean | null): Buffer {
    return this.INT(typeof value === "boolean" ? Number(value).toString() : value);
  },

  ADDRESS(value: string | null): Buffer {
    // Only sending the first 10 bytes (why ?)
    return hexBuffer(value ?? "").slice(0, 20);
  },

  STRING(value: string | null): Buffer {
    return Buffer.from(value ?? "", "utf-8");
  },

  BYTES(value: string | null, size?: number): Buffer {
    const failSafeValue = value ?? "";
    // Why slice again ?
    return hexBuffer(failSafeValue).slice(0, size ?? (failSafeValue?.length - 2) / 2);
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
  typeName?: string,
): [{ name: string; size: number | undefined } | null, Array<number | null>] => {
  // Will split "any[][1][10]" in "any", "[][1][10]"
  const splitNameAndArraysRegex = new RegExp(/^([^[\]]*)(\[.*\])*/g);
  // Will match all numbers (or null) inside each array. [0][10][] => [0,10,null]
  const splitArraysRegex = new RegExp(/\[(\d*)\]/g);
  // Will separate the the name from the potential bits/bytes allocation. uint8 => [uint,8]
  const splitNameAndNumberRegex = new RegExp(/(?=u?int|bytes)([a-zA-Z-0-9]+?)(\d{1,3})$/g);

  const [, type, maybeArrays] = splitNameAndArraysRegex.exec(typeName || "") || [];
  const [, name = type, size] = splitNameAndNumberRegex.exec(type || "") || [];
  const typeDescription = name ? { name, size: size ? Number(size) : undefined } : null;

  const arrays = maybeArrays ? [...maybeArrays.matchAll(splitArraysRegex)] : [];
  // Parse each size to either a Number or null
  const arrayLengths = arrays.map(([, arrayLength]) => (arrayLength ? Number(arrayLength) : null));

  return [typeDescription, arrayLengths];
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
  typeValue: number,
): string => {
  if (typeValue >= 16) {
    throw new Error(
      "Eth utils - constructTypeDescByteString - Cannot accept a typeValue >= 16 because the typeValue can only be 4 bits in binary" +
        { isArray, typeSize, typeValue },
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

  return intAsHexBytes(parseInt(isArrayBit + hasTypeSize + unusedBits + typeValueBits, 2), 1);
};

/**
 * @ignore for the README
 *
 * Helper to create the buffer to describe an EIP712 types' entry structure
 *
 * @param {EIP712MessageTypesEntry} entry
 * @returns {Buffer}
 */
export const makeTypeEntryStructBuffer = ({ name, type }: EIP712MessageTypesEntry): Buffer => {
  const [typeDescription, arrSizes] = destructTypeFromString(type as string);
  const isTypeAnArray = Boolean(arrSizes.length);
  const typeProperties =
    EIP712_TYPE_PROPERTIES[typeDescription?.name?.toUpperCase() || ""] ||
    EIP712_TYPE_PROPERTIES.CUSTOM;

  const typeKey = typeProperties.key(typeDescription?.size);
  const typeSize = typeProperties.size(typeDescription?.size);

  const typeDescData = constructTypeDescByteString(isTypeAnArray, typeSize, typeKey);

  const bufferArray: Buffer[] = [Buffer.from(typeDescData, "hex")];

  if (typeProperties === EIP712_TYPE_PROPERTIES.CUSTOM) {
    bufferArray.push(Buffer.from(intAsHexBytes(typeDescription?.name?.length ?? 0, 1), "hex"));
    bufferArray.push(Buffer.from(typeDescription?.name ?? "", "utf-8"));
  }

  if (typeof typeSize === "number") {
    bufferArray.push(Buffer.from(intAsHexBytes(typeSize, 1), "hex"));
  }

  if (isTypeAnArray) {
    bufferArray.push(Buffer.from(intAsHexBytes(arrSizes.length, 1), "hex"));

    arrSizes.forEach(size => {
      if (typeof size === "number") {
        bufferArray.push(
          Buffer.from(intAsHexBytes(EIP712_ARRAY_TYPE_VALUE.FIXED, 1), "hex"),
          Buffer.from(intAsHexBytes(size, 1), "hex"),
        );
      } else {
        bufferArray.push(Buffer.from(intAsHexBytes(EIP712_ARRAY_TYPE_VALUE.DYNAMIC, 1), "hex"));
      }
    });
  }

  bufferArray.push(Buffer.from(intAsHexBytes(name.length, 1), "hex"), Buffer.from(name, "utf-8"));

  return Buffer.concat(bufferArray);
};

/**
 * @ignore for the README
 *
 * Creates a map for each token provided with a `provideERC20TokenInfo` APDU
 * in order to keep track of their index in the memory of the device
 *
 * @param {MessageFilters | undefined} filters
 * @param {boolean} shouldUseV1Filters
 * @param {EIP712Message} message
 * @returns {Record<number, { token: string; coinRefMemorySlot?: number }>}
 */
export const getCoinRefTokensMap = (
  filters: MessageFilters | undefined,
  shouldUseV1Filters: boolean,
  message: EIP712Message,
): Record<number, { token: string; coinRefMemorySlot?: number }> => {
  const coinRefsTokensMap: Record<number, { token: string; coinRefMemorySlot?: number }> = {};
  if (shouldUseV1Filters || !filters) return coinRefsTokensMap;

  const tokenFilters = filters.fields
    .filter(({ format }) => format === "token")
    .sort((a, b) => (a.coin_ref || 0) - (b.coin_ref || 0));
  const tokens = tokenFilters.reduce<{ token: string; coinRef: number }[]>((acc, filter) => {
    const token = getValueFromPath(filter.path, message);
    if (Array.isArray(token)) {
      throw new Error("Array of tokens is not supported with a single coin ref");
    }

    return [...acc, { token, coinRef: filter.coin_ref! }];
  }, []);
  for (const { token, coinRef } of tokens) {
    coinRefsTokensMap[coinRef] = { token };
  }

  // For some messages like a Permit has no token address in its message, only the amount is provided.
  // In those cases, we'll need to provide the verifying contract contained in the EIP712 domain
  // The verifying contract is refrerenced by the coinRef 255 (0xff) in CAL and in the device
  // independently of the token index returned by the app after a providerERC20TokenInfo
  const shouldUseVerifyingContract = filters.fields.some(
    filter => filter.format === "amount" && filter.coin_ref === 255,
  );
  if (shouldUseVerifyingContract && message.domain.verifyingContract) {
    coinRefsTokensMap[255] = { token: message.domain.verifyingContract };
  }

  return coinRefsTokensMap;
};

/**
 * @ignore for the README
 *
 * Get the current application name loaded in Bolos and its version
 *
 * @param {Transport} transport
 * @returns {Promise<{name: string, version: string}>}
 */
export const getAppAndVersion = async (
  transport: Transport,
): Promise<{ name: string; version: string }> => {
  const appAndVersionHex = await transport.send(0xb0, 0x01, 0x00, 0x00);

  let offset = 1;
  const nameLength = appAndVersionHex[offset];
  offset += 1;
  const name = appAndVersionHex.subarray(offset, offset + nameLength).toString("ascii");
  offset += nameLength;
  const versionLength = appAndVersionHex[offset];
  offset += 1;
  const version = appAndVersionHex.subarray(offset, offset + versionLength).toString("ascii");

  return {
    name,
    version,
  };
};

/**
 * @ignore for the README
 *
 * Helper creating the buffer representing the display name and signature
 * of a filter which are prefixes & suffixes of a all V2 payloads
 *
 * @param {string} displayName
 * @param {string} sig
 * @returns {{ displayNameBuffer: Buffer; sigBuffer: Buffer }}
 */
export const getFilterDisplayNameAndSigBuffers = (
  displayName: string,
  sig: string,
): { displayNameBuffer: Buffer; sigBuffer: Buffer } => {
  const displayNameContentBuffer = Buffer.from(displayName);
  const displayNameLengthBuffer = Buffer.from(
    intAsHexBytes(displayNameContentBuffer.length, 1),
    "hex",
  );

  const sigContentBuffer = Buffer.from(sig, "hex");
  const sigLengthBuffer = Buffer.from(intAsHexBytes(sigContentBuffer.length, 1), "hex");

  return {
    displayNameBuffer: Buffer.concat([displayNameLengthBuffer, displayNameContentBuffer]),
    sigBuffer: Buffer.concat([sigLengthBuffer, sigContentBuffer]),
  };
};

/**
 * @ignore for the README
 *
 * Creates the payload for V2 filters following the spec provided here:
 *
 * @see https://github.com/LedgerHQ/app-ethereum/blob/develop/doc/ethapp.adoc#if-p2--message-info
 *
 * @param {FilteringInfoShowField["format"]} format
 * @param {FilteringInfoShowField["coinRef"]} coinRef
 * @param {FilteringInfoShowField["coinRefsTokensMap"]} coinRefsTokensMap
 * @param {Buffer} displayNameBuffer
 * @param {Buffer} sigBuffer
 * @returns {Buffer}
 */
export const getPayloadForFilterV2 = (
  format: FilteringInfoShowField["format"],
  coinRef: FilteringInfoShowField["coinRef"],
  coinRefsTokensMap: FilteringInfoShowField["coinRefsTokensMap"],
  displayNameBuffer: Buffer,
  sigBuffer: Buffer,
): Buffer => {
  switch (format) {
    case "raw":
    case "datetime":
      return Buffer.concat([displayNameBuffer, sigBuffer]);

    case "token": {
      const { deviceTokenIndex } = coinRefsTokensMap[coinRef!];

      return Buffer.concat([
        Buffer.from(intAsHexBytes(deviceTokenIndex || coinRef || 0, 1), "hex"),
        sigBuffer,
      ]);
    }

    case "amount": {
      const { deviceTokenIndex } = coinRefsTokensMap[coinRef!];

      return Buffer.concat([
        displayNameBuffer,
        Buffer.from(intAsHexBytes(deviceTokenIndex || coinRef || 0, 1), "hex"),
        sigBuffer,
      ]);
    }

    default:
      throw new Error("Invalid format");
  }
};
