import { EntryFunctionPayloadResponse, ScriptPayloadResponse } from "@aptos-labs/ts-sdk";
import { convertFunctionPayloadResponseToInputEntryFunctionData } from "../../logic/transactionsToOperations";

describe("convertFunctionPayloadResponseToInputEntryFunctionData", () => {
  it("should convert an entry function payload", () => {
    const payload: EntryFunctionPayloadResponse = {
      type: "entry_function_payload",
      function: "0x1::coin::transfer",
      type_arguments: [],
      arguments: ["0x12", 100],
    };

    const result = convertFunctionPayloadResponseToInputEntryFunctionData(payload);

    expect(result).toEqual({
      function: "0x1::coin::transfer",
      typeArguments: [],
      functionArguments: ["0x12", 100],
    });
  });

  it("should return undefined for a script payload without a function field", () => {
    const payload: ScriptPayloadResponse = {
      type: "script_payload",
      code: { bytecode: "0x", abi: undefined },
      type_arguments: [],
      arguments: [],
    };

    const result = convertFunctionPayloadResponseToInputEntryFunctionData(payload);

    expect(result).toBeUndefined();
  });

  it("should return undefined when payload is undefined", () => {
    const result = convertFunctionPayloadResponseToInputEntryFunctionData(
      undefined as unknown as EntryFunctionPayloadResponse,
    );

    expect(result).toBeUndefined();
  });
});
