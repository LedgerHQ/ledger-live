import Transport from "@ledgerhq/hw-transport";
import {
  EIP712Message,
  EIP712MessageTypes,
  EIP712MessageTypesEntry,
  StructDefData,
  StructImplemData,
} from "./EIP712.types";
import { hexBuffer, intAsHexBytes, splitPath } from "../../utils";
import {
  destructTypeFromString,
  EIP712_TYPE_ENCODERS,
  EIP712_TYPE_PROPERTIES,
  makeTypeEntryStructBuffer,
} from "./EIP712.utils";

/**
 * @ignore for the README
 *
 * Factory to create the recursive function that will pass on each
 * field level and APDUs to describe its structure implementation
 *
 * @param {Eth["EIP712SendStructImplem"]} EIP712SendStructImplem
 * @param {EIP712MessageTypes} types
 * @returns {void}
 */
const makeRecursiveFieldStructImplem = (
  transport: Transport,
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
      await EIP712SendStructImplem(transport, {
        structType: "array",
        value: data.length,
      });
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
      await EIP712SendStructImplem(transport, {
        structType: "field",
        value: {
          data,
          type: typeDescription?.name || "",
          sizeInBits: typeDescription?.bits,
        },
      });
    }
  };

  return recursiveFieldStructImplem;
};

/**
 * @ignore for the README
 *
 * This method is used to send the message definition with all its types.
 * This method should be used before the EIP712SendStructImplem one
 *
 * @param {String} structType
 * @param {String|Buffer} value
 * @returns {Promise<void>}
 */
const EIP712SendStructDef = (
  transport: Transport,
  structDef: StructDefData
): Promise<Buffer> => {
  enum APDU_FIELDS {
    CLA = 0xe0,
    INS = 0x1a,
    P1_complete = 0x00,
    P1_partial = 0x01,
    P2_name = 0x00,
    P2_field = 0xff,
  }

  const { structType, value } = structDef;
  const data =
    structType === "name" && typeof value === "string"
      ? Buffer.from(value, "utf-8")
      : (value as Buffer);

  return transport.send(
    APDU_FIELDS.CLA,
    APDU_FIELDS.INS,
    APDU_FIELDS.P1_complete,
    structType === "name" ? APDU_FIELDS.P2_name : APDU_FIELDS.P2_field,
    data
  );
};

/**
 * @ignore for the README
 *
 * This method provides a trusted new display name to use for the upcoming field.
 * This method should be used after the EIP712SendStructDef one.
 *
 * If the method describes an empty name (length of 0), the upcoming field will be taken
 * into account but won’t be shown on the device.
 *
 * The signature is computed on :
 * json key length || json key || display name length || display name
 *
 * signed by the following secp256k1 public key:
 * 0482bbf2f34f367b2e5bc21847b6566f21f0976b22d3388a9a5e446ac62d25cf725b62a2555b2dd464a4da0ab2f4d506820543af1d242470b1b1a969a27578f353
 *
 * @param {String} structType "root" | "array" | "field"
 * @param {string | number | StructFieldData} value
 * @returns {Promise<Buffer | void>}
 */
const EIP712SendStructImplem = async (
  transport: Transport,
  structImplem: StructImplemData
): Promise<Buffer | void> => {
  enum APDU_FIELDS {
    CLA = 0xe0,
    INS = 0x1c,
    P1_complete = 0x00,
    P1_partial = 0x01,
    P2_root = 0x00,
    P2_array = 0x0f,
    P2_field = 0xff,
  }

  const { structType, value } = structImplem;

  if (structType === "root") {
    return transport.send(
      APDU_FIELDS.CLA,
      APDU_FIELDS.INS,
      APDU_FIELDS.P1_complete,
      APDU_FIELDS.P2_root,
      Buffer.from(value, "utf-8")
    );
  }

  if (structType === "array") {
    return transport.send(
      APDU_FIELDS.CLA,
      APDU_FIELDS.INS,
      APDU_FIELDS.P1_complete,
      APDU_FIELDS.P2_array,
      Buffer.from(intAsHexBytes(value, 1), "hex")
    );
  }

  if (structType === "field") {
    const { data: rawData, type, sizeInBits } = value;
    const encodedData: Buffer | null = EIP712_TYPE_ENCODERS[
      type.toUpperCase()
    ]?.(rawData, sizeInBits);

    if (encodedData) {
      // const dataLengthPer16Bits = (encodedData.length & 0xff00) >> 8;
      const dataLengthPer16Bits = Math.floor(encodedData.length / 256);
      // const dataLengthModulo16Bits = encodedData.length & 0xff;
      const dataLengthModulo16Bits = encodedData.length % 256;

      const data = Buffer.concat([
        Buffer.from(intAsHexBytes(dataLengthPer16Bits, 1), "hex"),
        Buffer.from(intAsHexBytes(dataLengthModulo16Bits, 1), "hex"),
        encodedData,
      ]);

      const bufferSlices = new Array(Math.ceil(data.length / 256))
        .fill(null)
        .map((_, i) => data.slice(i * 255, (i + 1) * 255));

      for (const bufferSlice of bufferSlices) {
        await transport.send(
          APDU_FIELDS.CLA,
          APDU_FIELDS.INS,
          bufferSlice !== bufferSlices[bufferSlices.length - 1]
            ? APDU_FIELDS.P1_partial
            : APDU_FIELDS.P1_complete,
          APDU_FIELDS.P2_field,
          bufferSlice
        );
      }
    }
  }

  return Promise.resolve();
};

/**
 * @ignore for the README
 *
 * Sign an EIP-721 formatted message following the specification here:
 * https://github.com/LedgerHQ/app-ethereum/blob/develop/doc/ethapp.asc#sign-eth-eip-712
 * @example
  eth.signEIP721Message("44'/60'/0'/0/0", {
    domain: {
      chainId: 69,
      name: "Da Domain",
      verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
      version: "1"
    },
    types: {
      "EIP712Domain": [
            { name: "name", type: "string" },
            { name: "version", type: "string" },
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" }
        ],
      "Test": [
        { name: "contents", type: "string" }
      ]
    },
    primaryType: "Test",
    message: {contents: "Hello, Bob!"},
  })
 * 
 * @param {String} path derivationPath
 * @param {Object} jsonMessage message to sign
 * @param {Boolean} fullImplem use the legacy implementation
 * @returns {Promise}
 */
export const signEIP712Message = async (
  transport: Transport,
  path: string,
  jsonMessage: EIP712Message,
  fullImplem = false
): Promise<{
  v: number;
  s: string;
  r: string;
}> => {
  enum APDU_FIELDS {
    CLA = 0xe0,
    INS = 0x0c,
    P1 = 0x00,
    P2_v0 = 0x00,
    P2_full = 0x01,
  }
  const { primaryType, types, domain, message } = jsonMessage;

  const typeEntries = Object.entries(types) as [
    keyof EIP712MessageTypes,
    EIP712MessageTypesEntry[]
  ][];
  // Looping on all types entries and fields to send structures' definitions
  for (const [typeName, entries] of typeEntries) {
    await EIP712SendStructDef(transport, {
      structType: "name",
      value: typeName as string,
    });

    for (const { name, type } of entries) {
      const typeEntryBuffer = makeTypeEntryStructBuffer({ name, type });
      await EIP712SendStructDef(transport, {
        structType: "field",
        value: typeEntryBuffer,
      });
    }
  }

  // Create the recursion that should pass on each entry
  // of the domain fields and primaryType fields
  const recursiveFieldStructImplem = makeRecursiveFieldStructImplem(
    transport,
    types
  );

  // Looping on all domain type entries and fields to send
  // structures' implementations
  const domainName = "EIP712Domain";
  await EIP712SendStructImplem(transport, {
    structType: "root",
    value: domainName,
  });
  const domainTypeFields = types[domainName];
  for (const { name, type } of domainTypeFields) {
    const domainFieldValue = domain[name];
    await recursiveFieldStructImplem(
      destructTypeFromString(type as string),
      domainFieldValue
    );
  }

  // Looping on all primaryType type entries and fields to send
  // structures' implementations
  await EIP712SendStructImplem(transport, {
    structType: "root",
    value: primaryType,
  });
  const primaryTypeFields = types[primaryType];
  for (const { name, type } of primaryTypeFields) {
    const primaryTypeValue = message[name];
    await recursiveFieldStructImplem(
      destructTypeFromString(type as string),
      primaryTypeValue
    );
  }

  // Sending the final signature.
  const paths = splitPath(path);
  const signatureBuffer = Buffer.alloc(1 + paths.length * 4);
  signatureBuffer[0] = paths.length;
  paths.forEach((element, index) => {
    signatureBuffer.writeUInt32BE(element, 1 + 4 * index);
  });

  return transport
    .send(
      APDU_FIELDS.CLA,
      APDU_FIELDS.INS,
      APDU_FIELDS.P1,
      fullImplem ? APDU_FIELDS.P2_v0 : APDU_FIELDS.P2_full,
      signatureBuffer
    )
    .then((response) => {
      const v = response[0];
      const r = response.slice(1, 1 + 32).toString("hex");
      const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");

      return {
        v,
        r,
        s,
      };
    });
};

/**
 * @ignore for the README
 * Sign a prepared message following web3.eth.signTypedData specification. The host computes the domain separator and hashStruct(message)
 * @example
 eth.signEIP712HashedMessage("44'/60'/0'/0/0", Buffer.from("0101010101010101010101010101010101010101010101010101010101010101").toString("hex"), Buffer.from("0202020202020202020202020202020202020202020202020202020202020202").toString("hex")).then(result => {
 var v = result['v'] - 27;
 v = v.toString(16);
 if (v.length < 2) {
   v = "0" + v;
 }
 console.log("Signature 0x" + result['r'] + result['s'] + v);
 })
 */
export const signEIP712HashedMessage = (
  transport: Transport,
  path: string,
  domainSeparatorHex: string,
  hashStructMessageHex: string
): Promise<{
  v: number;
  s: string;
  r: string;
}> => {
  const domainSeparator = hexBuffer(domainSeparatorHex);
  const hashStruct = hexBuffer(hashStructMessageHex);
  const paths = splitPath(path);
  const buffer = Buffer.alloc(1 + paths.length * 4 + 32 + 32, 0);
  let offset = 0;
  buffer[0] = paths.length;
  paths.forEach((element, index) => {
    buffer.writeUInt32BE(element, 1 + 4 * index);
  });
  offset = 1 + 4 * paths.length;
  domainSeparator.copy(buffer, offset);
  offset += 32;
  hashStruct.copy(buffer, offset);

  return transport.send(0xe0, 0x0c, 0x00, 0x00, buffer).then((response) => {
    const v = response[0];
    const r = response.slice(1, 1 + 32).toString("hex");
    const s = response.slice(1 + 32, 1 + 32 + 32).toString("hex");
    return {
      v,
      r,
      s,
    };
  });
};

export { EIP712Message } from "./EIP712.types";
export { isEIP712Message } from "./EIP712.utils";
