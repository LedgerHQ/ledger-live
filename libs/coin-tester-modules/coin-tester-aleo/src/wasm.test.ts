import { loadAleoWasm } from "./wasm";

describe("loadAleoWasm", () => {
  it("loads the ESM-only Provable SDK under the tester's jest config", async () => {
    const wasm = await loadAleoWasm();
    expect(typeof wasm.ExecutionRequest.sign).toBe("function");
    expect(typeof wasm.ProgramManagerBase.buildDevnodeExecutionTransaction).toBe("function");
  });

  it("returns the same module instance on repeated calls", async () => {
    const [first, second] = await Promise.all([loadAleoWasm(), loadAleoWasm()]);
    expect(first).toBe(second);
  });
});
