import { NamedSchemaError } from "@reduxjs/toolkit/query";
import { describeIssues, describeSchemaFailure, unreadableResponse } from "./schemaFailure";

describe("describeIssues", () => {
  it("should join each issue with its path", () => {
    expect(
      describeIssues([
        { message: "Invalid input", path: ["intents", 0, { key: "id" }] },
        { message: "Required" },
      ]),
    ).toBe("intents.0.id: Invalid input; Required");
  });
});

describe("describeSchemaFailure", () => {
  it("should keep the name of the schema that failed", () => {
    const error = new NamedSchemaError(
      [{ message: "Invalid input", path: ["signature"] }],
      {},
      "argSchema",
      {},
    );

    expect(describeSchemaFailure(error)).toEqual({
      status: "CUSTOM_ERROR",
      error: "signature: Invalid input",
      data: { schemaName: "argSchema" },
    });
  });
});

describe("unreadableResponse", () => {
  it("should read like a failed raw response schema", () => {
    expect(unreadableResponse([{ message: "Invalid input", path: ["profile"] }])).toEqual({
      status: "CUSTOM_ERROR",
      error: "profile: Invalid input",
      data: { schemaName: "rawResponseSchema" },
    });
  });
});
