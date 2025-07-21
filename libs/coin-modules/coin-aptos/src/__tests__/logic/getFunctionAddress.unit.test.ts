import { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { getFunctionAddress } from "../../logic/getFunctionAddress";

describe("getFunctionAddress", () => {
  it("should return the function address when payload contains a function", () => {
    const payload: InputEntryFunctionData = {
      function: "0x1::coin::transfer",
      typeArguments: [],
      functionArguments: [],
    };

    const result = getFunctionAddress(payload);
    expect(result).toBe("0x1");
  });

  it("should return undefined when payload does not contain a function", () => {
    const payload = {
      function: "::::",
      typeArguments: [],
      functionArguments: [],
    } as InputEntryFunctionData;

    const result = getFunctionAddress(payload);
    expect(result).toBeUndefined();
  });

  it("should return undefined when payload is empty", () => {
    const payload = {} as InputEntryFunctionData;

    const result = getFunctionAddress(payload);
    expect(result).toBeUndefined();
  });
});
