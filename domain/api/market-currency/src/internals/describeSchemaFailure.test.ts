import { describeSchemaFailure } from "./describeSchemaFailure";

describe("describeSchemaFailure", () => {
  it("carries the rejected paths and messages onto the error", () => {
    const out = describeSchemaFailure({
      issues: [{ path: ["bitcoin"], message: "expected number" }],
      schemaName: "rawResponseSchema",
    });

    expect(out).toEqual({
      status: "CUSTOM_ERROR",
      error: "rawResponseSchema rejected the response — bitcoin: expected number",
    });
  });

  it("handles an issue with no path", () => {
    const out = describeSchemaFailure({
      issues: [{ message: "expected an array" }],
      schemaName: "rawResponseSchema",
    });

    expect(out).toEqual({
      status: "CUSTOM_ERROR",
      error: "rawResponseSchema rejected the response — expected an array",
    });
  });
});
