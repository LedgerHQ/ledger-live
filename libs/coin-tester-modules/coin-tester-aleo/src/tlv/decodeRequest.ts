import { bech32m } from "@ledgerhq/coin-aleo/logic/bech32m";
import { loadAleoWasm } from "../wasm";
import {
  LITERAL_TYPE_BY_BYTE,
  STRUCTURE_TYPE,
  TLV_TAG,
  TLV_VERSION_V1,
  VALUE_TYPE_EXTERNAL_RECORD,
  VALUE_TYPE_RECORD,
  VISIBILITY_BY_BYTE,
  isKnownTag,
  readTlv,
} from "./tags";

/** Fee limits carried by the root wrapper (`StructureType` 0x28). */
export type DecodedFeeLimits = {
  maxBaseFee: number;
  maxPriorityFee: number;
  feeFunctionName: string;
  feeProgramId: string;
};

export type DecodedRequest = {
  networkId: number;
  programId: string;
  functionName: string;
  /** snarkVM value strings, e.g. `"aleo1…"`, `"1000000u64"`, `"…field"`. */
  inputs: string[];
  /** `ValueType` strings, e.g. `"address.public"`. */
  inputTypes: string[];
  /** True when the request carries a `NestedCallCount` tag. */
  isRoot: boolean;
  nestedCallCount: number;
  /** Present only for a root intent; a fee intent comes without a wrapper. */
  feeLimits: DecodedFeeLimits | null;
  /** Present only for a request naming a program with a constructor (e.g. an ARC-22 token). */
  programChecksum: string | null;
};

const ALEO_ADDRESS_HRP = "aleo";
/** `aleo` + `1` + 52 data words + 6 checksum chars. */
const ALEO_ADDRESS_LENGTH = 63;

const UNSIGNED_INTEGER_WIDTHS: Readonly<Record<string, number>> = {
  u8: 1,
  u16: 2,
  u32: 4,
  u64: 8,
  u128: 16,
};

/** 32-byte commitment + 64-byte h-generator (x, y) coordinates (tlv.rs:568-581). */
const RECORD_INPUT_VALUE_LENGTH = 96;

/**
 * Looks up the plaintext for a record input's commitment. Must throw for an
 * unknown commitment — never return `undefined`, which would surface as an
 * unreadable failure much later in signing.
 */
export type ResolveRecord = (commitment: string) => string;

function toBytes(hex: string): Uint8Array {
  const buffer = Buffer.from(hex, "hex");
  if (buffer.length * 2 !== hex.length) {
    throw new Error("aleo coin-tester: TLV payload is not valid hex");
  }
  return new Uint8Array(buffer);
}

function readU32Be(value: Uint8Array, field: string): number {
  if (value.length !== 4) {
    throw new Error(`aleo coin-tester: expected 4 bytes for ${field}, got ${value.length}`);
  }
  // `<<`/`|` coerce to signed 32-bit, so a set high bit would flip the sign;
  // `>>> 0` reinterprets the result as unsigned.
  return ((value[0] << 24) | (value[1] << 16) | (value[2] << 8) | value[3]) >>> 0;
}

function readUnsignedLe(value: Uint8Array, width: number, literal: string): bigint {
  if (value.length !== width) {
    throw new Error(
      `aleo coin-tester: expected ${width} bytes for a ${literal} input, got ${value.length}`,
    );
  }
  let out = 0n;
  for (let i = value.length - 1; i >= 0; i--) out = (out << 8n) | BigInt(value[i]);
  return out;
}

/** Decodes one `InputTypes` value into a `ValueType` string. */
function decodeInputType(bytes: Uint8Array): { type: string; literal: string } {
  const [discriminant] = bytes;
  if (discriminant === VALUE_TYPE_RECORD) {
    const nameLength = bytes[1];
    const name = Buffer.from(bytes.subarray(2, 2 + nameLength)).toString("ascii");
    return { type: `${name}.record`, literal: "record" };
  }
  if (discriminant === VALUE_TYPE_EXTERNAL_RECORD) {
    throw new Error(
      "aleo coin-tester: external record input types are not supported — this decoder only covers public transfers",
    );
  }

  const visibility = VISIBILITY_BY_BYTE[discriminant];
  if (!visibility) {
    throw new Error(
      `aleo coin-tester: unknown ValueType discriminant 0x${(discriminant ?? 0).toString(16)}`,
    );
  }

  const [plaintextKind, literalByte] = [bytes[1], bytes[2]];
  if (plaintextKind !== 0x00) {
    throw new Error(
      "aleo coin-tester: struct and array input types are not supported — this decoder only covers public transfers",
    );
  }

  const literal = LITERAL_TYPE_BY_BYTE[literalByte];
  if (!literal) {
    throw new Error(`aleo coin-tester: unknown literal type byte 0x${literalByte.toString(16)}`);
  }

  return { type: `${literal}.${visibility}`, literal };
}

/**
 * Rebuilds one `InputValues` blob into the snarkVM value string.
 *
 * The Rust side writes an address as its raw 32-byte group and every other
 * literal as `to_bytes_le()` minus the two leading type bytes
 * (`encode_input_value`, tlv.rs:539-554).
 */
async function decodeInputValue(
  literal: string,
  bytes: Uint8Array,
  resolveRecord: ResolveRecord | undefined,
): Promise<string> {
  if (literal === "record") {
    if (bytes.length !== RECORD_INPUT_VALUE_LENGTH) {
      throw new Error(
        `aleo coin-tester: expected ${RECORD_INPUT_VALUE_LENGTH} bytes for a record input, got ${bytes.length}`,
      );
    }
    const wasm = await loadAleoWasm();
    const commitment = wasm.Field.fromBytesLe(bytes.subarray(0, 32)).toString();
    if (!resolveRecord) {
      throw new Error(
        `aleo coin-tester: no resolver supplied for a record input with commitment ${commitment}`,
      );
    }
    return resolveRecord(commitment);
  }

  if (literal === "address") {
    if (bytes.length !== 32) {
      throw new Error(`aleo coin-tester: expected 32 bytes for an address, got ${bytes.length}`);
    }
    return bech32m.encode(ALEO_ADDRESS_HRP, bech32m.toWords(bytes), ALEO_ADDRESS_LENGTH);
  }

  const width = UNSIGNED_INTEGER_WIDTHS[literal];
  if (width) {
    return `${readUnsignedLe(bytes, width, literal)}${literal}`;
  }

  if (literal === "field") {
    const wasm = await loadAleoWasm();
    return wasm.Field.fromBytesLe(bytes).toString();
  }

  throw new Error(
    `aleo coin-tester: cannot rebuild a '${literal}' input — this decoder only covers public transfers`,
  );
}

function assertHeader(bytes: Uint8Array, expectedStructure: number): number {
  const structure = readTlv(bytes, 0);
  if (structure.tag !== TLV_TAG.StructureType || structure.value[0] !== expectedStructure) {
    throw new Error(
      `aleo coin-tester: expected structure type 0x${expectedStructure.toString(16)}, got ${[...structure.value]}`,
    );
  }
  const version = readTlv(bytes, structure.next);
  if (version.tag !== TLV_TAG.Version || version.value[0] !== TLV_VERSION_V1) {
    throw new Error(`aleo coin-tester: unsupported TLV version ${[...version.value]}`);
  }
  return version.next;
}

async function decodeRequestBody(
  bytes: Uint8Array,
  resolveRecord: ResolveRecord | undefined,
): Promise<Omit<DecodedRequest, "feeLimits">> {
  let offset = assertHeader(bytes, STRUCTURE_TYPE.Request);

  let networkId: number | null = null;
  let programId: string | null = null;
  let functionName: string | null = null;
  let inputCount: number | null = null;
  let nestedCallCount: number | null = null;
  let programChecksum: string | null = null;
  const inputTypes: string[] = [];
  const literals: string[] = [];
  const inputs: string[] = [];

  while (offset < bytes.length) {
    const { tag, value, next } = readTlv(bytes, offset);
    offset = next;

    if (!isKnownTag(tag)) {
      throw new Error(`aleo coin-tester: unknown TLV tag 0x${tag.toString(16)}`);
    }

    switch (tag) {
      case TLV_TAG.NetworkId:
        networkId = (value[0] << 8) | value[1];
        break;
      case TLV_TAG.ProgramId:
        programId = Buffer.from(value).toString("ascii");
        break;
      case TLV_TAG.FunctionName:
        functionName = Buffer.from(value).toString("ascii");
        break;
      case TLV_TAG.InputCount:
        inputCount = value[0];
        break;
      case TLV_TAG.InputTypes: {
        const decoded = decodeInputType(value);
        inputTypes.push(decoded.type);
        literals.push(decoded.literal);
        break;
      }
      case TLV_TAG.InputValues: {
        const literal = literals[inputs.length];
        if (!literal) {
          throw new Error("aleo coin-tester: an InputValues tag arrived before its InputTypes tag");
        }
        inputs.push(await decodeInputValue(literal, value, resolveRecord));
        break;
      }
      case TLV_TAG.NestedCallCount:
        nestedCallCount = value[0];
        break;
      case TLV_TAG.ProgramChecksum: {
        const wasm = await loadAleoWasm();
        programChecksum = wasm.Field.fromBytesLe(value).toString();
        break;
      }
      default:
        throw new Error(
          `aleo coin-tester: tag 0x${tag.toString(16)} is not valid inside a request`,
        );
    }
  }

  if (networkId === null) throw new Error("aleo coin-tester: missing network id (0xc3) in TLV");
  if (!programId) throw new Error("aleo coin-tester: missing program id (0xb5) in TLV");
  if (!functionName) throw new Error("aleo coin-tester: missing function name (0xb6) in TLV");
  if (inputCount === null) throw new Error("aleo coin-tester: missing input count (0xb7) in TLV");
  if (inputCount !== inputs.length || inputCount !== inputTypes.length) {
    throw new Error(
      `aleo coin-tester: input count mismatch — header says ${inputCount}, decoded ${inputs.length} values and ${inputTypes.length} types`,
    );
  }

  return {
    networkId,
    programId,
    functionName,
    inputs,
    inputTypes,
    isRoot: nestedCallCount !== null,
    nestedCallCount: nestedCallCount ?? 0,
    programChecksum,
  };
}

/**
 * Decodes the TLV blob the aleo-backend hands to the signer.
 *
 * Accepts both shapes `request_to_tlv` can produce: a root intent wrapped in a
 * `0x28` structure carrying the fee limits, and a bare `0x29` fee intent.
 */
export async function decodeRequestTlv(
  hex: string,
  { resolveRecord }: { resolveRecord?: ResolveRecord } = {},
): Promise<DecodedRequest> {
  const bytes = toBytes(hex);
  const structure = readTlv(bytes, 0);

  if (structure.tag !== TLV_TAG.StructureType) {
    throw new Error("aleo coin-tester: TLV does not start with a structure type tag");
  }

  if (structure.value[0] === STRUCTURE_TYPE.Request) {
    return { ...(await decodeRequestBody(bytes, resolveRecord)), feeLimits: null };
  }

  if (structure.value[0] !== STRUCTURE_TYPE.Root) {
    throw new Error(`aleo coin-tester: unexpected structure type ${[...structure.value]}`);
  }

  let offset = assertHeader(bytes, STRUCTURE_TYPE.Root);
  let maxBaseFee: number | null = null;
  let maxPriorityFee: number | null = null;
  let feeFunctionName: string | null = null;
  let feeProgramId: string | null = null;
  let inner: Uint8Array | null = null;

  while (offset < bytes.length) {
    const { tag, value, next } = readTlv(bytes, offset);
    offset = next;

    if (!isKnownTag(tag)) {
      throw new Error(`aleo coin-tester: unknown TLV tag 0x${tag.toString(16)}`);
    }

    switch (tag) {
      case TLV_TAG.MaxBaseFee:
        maxBaseFee = readU32Be(value, "max base fee");
        break;
      case TLV_TAG.MaxPriorityFee:
        maxPriorityFee = readU32Be(value, "max priority fee");
        break;
      case TLV_TAG.FeeFunctionName:
        feeFunctionName = Buffer.from(value).toString("ascii");
        break;
      case TLV_TAG.FeeProgramId:
        feeProgramId = Buffer.from(value).toString("ascii");
        break;
      case TLV_TAG.Request:
        inner = value;
        break;
      default:
        throw new Error(
          `aleo coin-tester: tag 0x${tag.toString(16)} is not valid inside a root intent`,
        );
    }
  }

  if (!inner) throw new Error("aleo coin-tester: missing request (0xb4) in the root intent");
  if (maxBaseFee === null || maxPriorityFee === null || !feeFunctionName || !feeProgramId) {
    throw new Error("aleo coin-tester: incomplete fee limits in the root intent");
  }

  return {
    ...(await decodeRequestBody(inner, resolveRecord)),
    feeLimits: { maxBaseFee, maxPriorityFee, feeFunctionName, feeProgramId },
  };
}
