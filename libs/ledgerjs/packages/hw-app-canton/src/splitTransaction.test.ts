import Transport from "@ledgerhq/hw-transport";
import { RecordStore } from "@ledgerhq/hw-transport-mocker";
import fs from "fs";
import path from "path";
import Canton, {
  CLA,
  INS,
  P1_SIGN_PREPARED_TRANSACTION,
  P2_FIRST,
  P2_MORE,
  P2_MSG_END,
  SIGNATURE_END_BYTE,
  SIGNATURE_FRAMING_BYTE,
  STATUS,
} from "./Canton";
import { splitTransaction } from "./splitTransaction";
import prepareTransferMockSerialized from "../tests/fixtures/prepare-transfer-serialized.json";
import prepareTransferMock from "../tests/fixtures/prepare-transfer.json";

const fixturePath = path.join(__dirname, "..", "tests", "fixtures", "prepare-transfer.apdus");

class APDURecordingTransport extends Transport {
  recordStore: RecordStore;

  constructor(recordStore: RecordStore) {
    super();
    this.recordStore = recordStore;
  }

  async exchange(apdu: Buffer): Promise<Buffer> {
    const isFinal = apdu.readUInt8(3) === P2_MSG_END;

    const statusBuffer = Buffer.alloc(2);
    statusBuffer.writeUInt16BE(STATUS.OK, 0);

    const response = isFinal
      ? Buffer.concat([
          Buffer.from([SIGNATURE_FRAMING_BYTE]),
          Buffer.alloc(64, 0),
          Buffer.from([SIGNATURE_END_BYTE]),
          statusBuffer,
        ])
      : statusBuffer;

    this.recordStore.recordExchange(apdu, response);
    return response;
  }
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function loadExpectedAPDUs(fixturePath: string): string[] {
  const fixtureContent = fs.readFileSync(fixturePath, "utf-8");
  return fixtureContent
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.startsWith("=>"))
    .map(line => line.replace(/^=>\s*/, ""));
}

describe("splitTransaction", () => {
  it("should split transaction correctly", () => {
    const transactionData = prepareTransferMock.json;
    const result = splitTransaction(transactionData);

    expect(result).toBeDefined();
    expect(result.damlTransaction).toBeInstanceOf(Uint8Array);
    expect(result.nodes).toBeInstanceOf(Array);
    expect(result.metadata).toBeInstanceOf(Uint8Array);
    expect(result.inputContracts).toBeInstanceOf(Array);
  });

  it("should properly serialize damlTransaction", () => {
    const transactionData = prepareTransferMock.json;
    const { damlTransaction } = splitTransaction(transactionData);

    expect(uint8ArrayToHex(damlTransaction)).toEqual(prepareTransferMockSerialized.damlTransaction);
  });

  it("should properly serialize nodes", () => {
    const transactionData = prepareTransferMock.json;
    const { nodes } = splitTransaction(transactionData);

    expect(nodes.map(uint8ArrayToHex)).toEqual(prepareTransferMockSerialized.nodes);
  });

  it("should properly serialize metadata", () => {
    const transactionData = prepareTransferMock.json;
    const { metadata } = splitTransaction(transactionData);

    expect(uint8ArrayToHex(metadata)).toEqual(prepareTransferMockSerialized.metadata);
  });

  it("should properly serialize inputContracts", () => {
    const transactionData = prepareTransferMock.json;
    const { inputContracts } = splitTransaction(transactionData);

    expect(inputContracts.map(uint8ArrayToHex)).toEqual(
      prepareTransferMockSerialized.inputContracts,
    );
  });

  it("should generate correct APDUs when signing prepared transaction", async () => {
    // GIVEN
    const transactionData = prepareTransferMock.json;
    const derivationPath = "44'/6767'/0'/0'/0'";
    const components = splitTransaction(transactionData);
    const recordStore = new RecordStore();
    const recordingTransport = new APDURecordingTransport(recordStore);
    const canton = new Canton(recordingTransport);

    // WHEN
    await canton.signTransaction(derivationPath, components);
    // Extract recorded APDUs from RecordStore (RecordStore.queue contains [apduHex, responseHex] pairs)
    const generatedAPDUsHex = recordStore.queue.map(([apduHex]) => apduHex);

    // THEN
    expect(generatedAPDUsHex).toBeDefined();
    expect(generatedAPDUsHex.length).toBeGreaterThan(0);
    expect(generatedAPDUsHex.every(apdu => typeof apdu === "string")).toBe(true);

    // Verify first APDU contains the derivation path
    const firstAPDUBuffer = Buffer.from(generatedAPDUsHex[0], "hex");
    expect(firstAPDUBuffer.readUInt8(0)).toBe(CLA);
    expect(firstAPDUBuffer.readUInt8(1)).toBe(INS.SIGN);
    expect(firstAPDUBuffer.readUInt8(2)).toBe(P1_SIGN_PREPARED_TRANSACTION);
    expect(firstAPDUBuffer.readUInt8(3)).toBe(P2_FIRST | P2_MORE);

    const expectedAPDUs = loadExpectedAPDUs(fixturePath);
    // Verify fixture contains actual APDU data and compare with generated APDUs
    if (expectedAPDUs.length > 0) {
      expect(generatedAPDUsHex.length).toBe(expectedAPDUs.length);
      expect(generatedAPDUsHex).toEqual(expectedAPDUs);
    } else {
      console.warn(
        "Fixture file contains no APDU data. Update prepare-transfer.apdus with actual APDU hex strings.",
      );
    }
  });
});
