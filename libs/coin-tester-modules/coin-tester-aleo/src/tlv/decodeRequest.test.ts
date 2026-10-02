import { decodeRequestTlv } from "./decodeRequest";
import { encodeTlv, STRUCTURE_TYPE, TLV_TAG, TLV_VERSION_V1 } from "./tags";
import { loadAleoWasm } from "../wasm";

const RECIPIENT = "aleo1l2x2kxsv3qt4m0364ezpx50y0t47f7pdme0jt0y9m4dxzeck8yxqqgac0y";

function hex(bytes: number[]): string {
  return Buffer.from(bytes).toString("hex");
}

function u64Le(value: bigint): number[] {
  const out: number[] = [];
  for (let i = 0; i < 8; i++) out.push(Number((value >> BigInt(8 * i)) & 0xffn));
  return out;
}

/** Builds the `0x29` request body the Rust `encode_request_tlv` emits. */
function requestBody({
  programId,
  functionName,
  inputs,
  isRoot = true,
}: {
  programId: string;
  functionName: string;
  inputs: { typeBytes: number[]; valueBytes: number[] }[];
  isRoot?: boolean;
}): number[] {
  const out: number[] = [
    ...encodeTlv(TLV_TAG.StructureType, [STRUCTURE_TYPE.Request]),
    ...encodeTlv(TLV_TAG.Version, [TLV_VERSION_V1]),
    ...encodeTlv(TLV_TAG.NetworkId, [0x00, 0x01]),
    ...encodeTlv(TLV_TAG.ProgramId, [...Buffer.from(programId, "ascii")]),
    ...encodeTlv(TLV_TAG.FunctionName, [...Buffer.from(functionName, "ascii")]),
    ...encodeTlv(TLV_TAG.InputCount, [inputs.length]),
  ];
  for (const input of inputs) {
    out.push(...encodeTlv(TLV_TAG.InputTypes, input.typeBytes));
    out.push(...encodeTlv(TLV_TAG.InputValues, input.valueBytes));
  }
  if (isRoot) out.push(...encodeTlv(TLV_TAG.NestedCallCount, [0x00]));
  return out;
}

async function addressBytes(address: string): Promise<number[]> {
  const wasm = await loadAleoWasm();
  return [...wasm.Address.from_string(address).toBytesLe()];
}

function recordTypeBytes(recordName: string): number[] {
  return [0x03, recordName.length, ...Buffer.from(recordName, "ascii")];
}

/** A commitment field plus its 32-byte LE encoding, for building a record `InputValues` entry. */
async function commitmentField(value: string): Promise<{ bytes: number[]; commitment: string }> {
  const wasm = await loadAleoWasm();
  const field = wasm.Field.fromString(value);
  return { bytes: [...field.toBytesLe()], commitment: field.toString() };
}

/** 32-byte commitment followed by 64 filler bytes standing in for the h-generator coordinates. */
function recordValueBytes(commitmentBytes: number[]): number[] {
  return [...commitmentBytes, ...new Array(64).fill(0)];
}

describe("decodeRequestTlv", () => {
  it("decodes a root transfer_public intent, wrapper and all", async () => {
    const inner = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_public",
      inputs: [
        { typeBytes: [0x01, 0x00, 0x00], valueBytes: await addressBytes(RECIPIENT) },
        { typeBytes: [0x01, 0x00, 0x0c], valueBytes: u64Le(1_000_000n) },
      ],
    });

    const root = [
      ...encodeTlv(TLV_TAG.StructureType, [STRUCTURE_TYPE.Root]),
      ...encodeTlv(TLV_TAG.Version, [TLV_VERSION_V1]),
      ...encodeTlv(TLV_TAG.MaxBaseFee, [0x00, 0x00, 0x85, 0x0c]),
      ...encodeTlv(TLV_TAG.MaxPriorityFee, [0x00, 0x00, 0x00, 0x00]),
      ...encodeTlv(TLV_TAG.FeeFunctionName, [...Buffer.from("fee_public", "ascii")]),
      ...encodeTlv(TLV_TAG.FeeProgramId, [...Buffer.from("credits.aleo", "ascii")]),
      ...encodeTlv(TLV_TAG.Request, inner),
    ];

    const decoded = await decodeRequestTlv(hex(root));

    expect(decoded.programId).toBe("credits.aleo");
    expect(decoded.functionName).toBe("transfer_public");
    expect(decoded.networkId).toBe(1);
    expect(decoded.isRoot).toBe(true);
    expect(decoded.inputs).toStrictEqual([RECIPIENT, "1000000u64"]);
    expect(decoded.inputTypes).toStrictEqual(["address.public", "u64.public"]);
    expect(decoded.feeLimits).toStrictEqual({
      maxBaseFee: 34060,
      maxPriorityFee: 0,
      feeFunctionName: "fee_public",
      feeProgramId: "credits.aleo",
    });
  });

  it("decodes a MaxBaseFee with the high bit set as unsigned, not negative", async () => {
    const inner = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_public",
      inputs: [
        { typeBytes: [0x01, 0x00, 0x00], valueBytes: await addressBytes(RECIPIENT) },
        { typeBytes: [0x01, 0x00, 0x0c], valueBytes: u64Le(1_000_000n) },
      ],
    });

    const root = [
      ...encodeTlv(TLV_TAG.StructureType, [STRUCTURE_TYPE.Root]),
      ...encodeTlv(TLV_TAG.Version, [TLV_VERSION_V1]),
      ...encodeTlv(TLV_TAG.MaxBaseFee, [0xff, 0xff, 0xff, 0xff]),
      ...encodeTlv(TLV_TAG.MaxPriorityFee, [0x80, 0x00, 0x00, 0x00]),
      ...encodeTlv(TLV_TAG.FeeFunctionName, [...Buffer.from("fee_public", "ascii")]),
      ...encodeTlv(TLV_TAG.FeeProgramId, [...Buffer.from("credits.aleo", "ascii")]),
      ...encodeTlv(TLV_TAG.Request, inner),
    ];

    const decoded = await decodeRequestTlv(hex(root));

    expect(decoded.feeLimits?.maxBaseFee).toBe(4_294_967_295);
    expect(decoded.feeLimits?.maxPriorityFee).toBe(2_147_483_648);
  });

  it("decodes a bare fee_public intent, including the field input", async () => {
    const wasm = await loadAleoWasm();
    const executionId = "1234field";
    const bare = requestBody({
      programId: "credits.aleo",
      functionName: "fee_public",
      inputs: [
        { typeBytes: [0x01, 0x00, 0x0c], valueBytes: u64Le(34_060n) },
        { typeBytes: [0x01, 0x00, 0x0c], valueBytes: u64Le(0n) },
        {
          typeBytes: [0x01, 0x00, 0x02],
          valueBytes: [...wasm.Field.fromString(executionId).toBytesLe()],
        },
      ],
    });

    const decoded = await decodeRequestTlv(hex(bare));

    expect(decoded.functionName).toBe("fee_public");
    expect(decoded.isRoot).toBe(true);
    expect(decoded.feeLimits).toBeNull();
    expect(decoded.inputs).toStrictEqual(["34060u64", "0u64", executionId]);
    expect(decoded.inputTypes).toStrictEqual(["u64.public", "u64.public", "field.public"]);
  });

  it("throws on an unknown tag", async () => {
    const bytes = [
      ...encodeTlv(TLV_TAG.StructureType, [STRUCTURE_TYPE.Request]),
      ...encodeTlv(TLV_TAG.Version, [TLV_VERSION_V1]),
      ...encodeTlv(0x7f, [0x00]),
    ];
    await expect(decodeRequestTlv(hex(bytes))).rejects.toThrow(/unknown TLV tag/i);
  });

  it("throws on an external record input type", async () => {
    const bytes = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_private",
      inputs: [{ typeBytes: [0x04], valueBytes: [0x00] }],
    });
    await expect(decodeRequestTlv(hex(bytes))).rejects.toThrow(/external record/i);
  });

  it("throws on a literal type it cannot rebuild", async () => {
    const bytes = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_public",
      // 0x03 is `group`: a known literal type, but one this decoder does not rebuild.
      inputs: [{ typeBytes: [0x01, 0x00, 0x03], valueBytes: new Array(32).fill(0) }],
    });
    await expect(decodeRequestTlv(hex(bytes))).rejects.toThrow(/group/i);
  });

  it("throws when the input count does not match the decoded inputs", async () => {
    const inner = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_public",
      inputs: [{ typeBytes: [0x01, 0x00, 0x0c], valueBytes: u64Le(1n) }],
    });
    // Overwrite the InputCount value byte (last byte of its TLV) with 2.
    const countTagIndex = inner.findIndex(
      (b, i) => b === 0x81 && inner[i + 1] === TLV_TAG.InputCount,
    );
    inner[countTagIndex + 3] = 0x02;
    await expect(decodeRequestTlv(hex(inner))).rejects.toThrow(/input count/i);
  });

  it("decodes a record input type, reading the record name after the discriminant", async () => {
    const { bytes: commitmentBytes } = await commitmentField("42field");
    const bytes = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_private",
      inputs: [
        { typeBytes: recordTypeBytes("credits"), valueBytes: recordValueBytes(commitmentBytes) },
      ],
    });

    const decoded = await decodeRequestTlv(hex(bytes), { resolveRecord: () => "{ record }" });

    expect(decoded.inputTypes).toStrictEqual(["credits.record"]);
  });

  it("decodes a record input value, passing the resolver the first 32 bytes as the commitment", async () => {
    const { bytes: commitmentBytes, commitment } = await commitmentField("42field");
    const bytes = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_private",
      inputs: [
        { typeBytes: recordTypeBytes("credits"), valueBytes: recordValueBytes(commitmentBytes) },
      ],
    });

    const seenCommitments: string[] = [];
    const resolveRecord = (seen: string): string => {
      seenCommitments.push(seen);
      return "{ owner: aleo1…, microcredits: 1000u64.private, _nonce: 1group.public }";
    };

    const decoded = await decodeRequestTlv(hex(bytes), { resolveRecord });

    expect(seenCommitments).toStrictEqual([commitment]);
    expect(decoded.inputs).toStrictEqual([
      "{ owner: aleo1…, microcredits: 1000u64.private, _nonce: 1group.public }",
    ]);
  });

  it("throws, naming the commitment, when a record input has no resolver", async () => {
    const { bytes: commitmentBytes, commitment } = await commitmentField("42field");
    const bytes = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_private",
      inputs: [
        { typeBytes: recordTypeBytes("credits"), valueBytes: recordValueBytes(commitmentBytes) },
      ],
    });

    await expect(decodeRequestTlv(hex(bytes))).rejects.toThrow(commitment);
  });

  it("propagates a resolver's error for an unknown commitment instead of returning undefined", async () => {
    const { bytes: commitmentBytes } = await commitmentField("42field");
    const bytes = requestBody({
      programId: "credits.aleo",
      functionName: "transfer_private",
      inputs: [
        { typeBytes: recordTypeBytes("credits"), valueBytes: recordValueBytes(commitmentBytes) },
      ],
    });

    const resolveRecord = (seen: string): string => {
      throw new Error(`unknown commitment ${seen}`);
    };

    await expect(decodeRequestTlv(hex(bytes), { resolveRecord })).rejects.toThrow(
      /unknown commitment/,
    );
  });
});

/** A minimal `transfer_public(address, u64)`-shaped request body, StructureType 0x29. */
function buildRequestBody(extraTags: number[][] = []): number[] {
  const programId = Buffer.from("credits.aleo", "ascii");
  const functionName = Buffer.from("transfer_public", "ascii");
  return [
    ...encodeTlv(TLV_TAG.StructureType, [STRUCTURE_TYPE.Request]),
    ...encodeTlv(TLV_TAG.Version, [TLV_VERSION_V1]),
    ...encodeTlv(TLV_TAG.NetworkId, [0x00, 0x01]),
    ...encodeTlv(TLV_TAG.ProgramId, programId),
    ...encodeTlv(TLV_TAG.FunctionName, functionName),
    ...encodeTlv(TLV_TAG.InputCount, [0x00]),
    ...encodeTlv(TLV_TAG.NestedCallCount, [0x00]),
    ...extraTags.flat(),
  ];
}

describe("decodeRequestTlv — ProgramChecksum", () => {
  it("returns programChecksum: null when the tag is absent", async () => {
    const bytes = Buffer.from(buildRequestBody());
    const decoded = await decodeRequestTlv(bytes.toString("hex"));
    expect(decoded.programChecksum).toBeNull();
  });

  it("decodes a present ProgramChecksum tag as a field value", async () => {
    const checksumBytes = Buffer.alloc(32, 0x01);
    const bytes = Buffer.from(
      buildRequestBody([encodeTlv(TLV_TAG.ProgramChecksum, checksumBytes)]),
    );
    const decoded = await decodeRequestTlv(bytes.toString("hex"));
    expect(decoded.programChecksum).not.toBeNull();
    expect(typeof decoded.programChecksum).toBe("string");
  });
});
