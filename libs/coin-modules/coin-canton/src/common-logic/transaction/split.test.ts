import prepareTransferMockSerialized from "../../test/prepare-transfer-serialized.json";
import prepareTransferMock from "../../test/prepare-transfer.json";
import { splitTransaction } from "./split";

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

describe("splitTransaction", () => {
  it("should split transaction correctly", () => {
    const transactionData = prepareTransferMock;
    const result = splitTransaction(transactionData);

    expect(result).toBeDefined();
    expect(result.damlTransaction).toBeInstanceOf(Uint8Array);
    expect(result.nodes).toBeInstanceOf(Array);
    expect(result.metadata).toBeInstanceOf(Uint8Array);
    expect(result.inputContracts).toBeInstanceOf(Array);
  });

  it("should properly serialize damlTransaction", () => {
    const transactionData = prepareTransferMock;
    const { damlTransaction } = splitTransaction(transactionData);

    expect(uint8ArrayToHex(damlTransaction)).toEqual(prepareTransferMockSerialized.damlTransaction);
  });

  it("should properly serialize nodes", () => {
    const transactionData = prepareTransferMock;
    const { nodes } = splitTransaction(transactionData);

    expect(nodes.map(uint8ArrayToHex)).toEqual(prepareTransferMockSerialized.nodes);
  });

  it("should properly serialize metadata", () => {
    const transactionData = prepareTransferMock;
    const { metadata } = splitTransaction(transactionData);

    expect(uint8ArrayToHex(metadata)).toEqual(prepareTransferMockSerialized.metadata);
  });

  it("should properly serialize inputContracts", () => {
    const transactionData = prepareTransferMock;
    const { inputContracts } = splitTransaction(transactionData);

    expect(inputContracts.map(uint8ArrayToHex)).toEqual(
      prepareTransferMockSerialized.inputContracts,
    );
  });
});
