import { toSchemaFailureError } from "./schemaFailure";

describe("toSchemaFailureError", () => {
  it("names the schema and lists the issues", () => {
    const error = toSchemaFailureError("rawResponseSchema", [
      { message: "Required", path: ["access_token"] },
      { message: "Expected number", path: ["expires_in"] },
    ]);

    expect(error).toEqual({
      status: "CUSTOM_ERROR",
      error: "rawResponseSchema validation failed",
      data: [
        { path: "access_token", message: "Required" },
        { path: "expires_in", message: "Expected number" },
      ],
    });
  });

  it("joins a nested path and reads an object segment", () => {
    const error = toSchemaFailureError("responseSchema", [
      { message: "Required", path: ["session", { key: "accessToken" }, 0] },
    ]);

    expect(error.data).toEqual([{ path: "session.accessToken.0", message: "Required" }]);
  });

  it("answers an empty path when the issue carries none", () => {
    const error = toSchemaFailureError("responseSchema", [{ message: "Invalid input" }]);

    expect(error.data).toEqual([{ path: "", message: "Invalid input" }]);
  });

  it("carries no value, so a token response cannot leak through it", () => {
    const error = toSchemaFailureError("rawResponseSchema", [
      { message: "String must contain at least 1 character(s)", path: ["access_token"] },
    ]);

    expect(JSON.stringify(error)).not.toContain("sentinel");
  });
});
