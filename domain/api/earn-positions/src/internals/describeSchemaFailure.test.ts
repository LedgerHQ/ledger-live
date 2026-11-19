import { NamedSchemaError } from "@reduxjs/toolkit/query";
import { describeSchemaFailure } from "./describeSchemaFailure";

type Issues = ConstructorParameters<typeof NamedSchemaError>[0];

const rejection = (issues: Issues, value: unknown = {}) =>
  new NamedSchemaError(issues, value, "rawResponseSchema", undefined);

describe("describeSchemaFailure", () => {
  it("names each field the response was rejected on", () => {
    const error = describeSchemaFailure(
      rejection([
        { path: ["data", 0, "stake", "details", "stake_account"], message: "Invalid input" },
        { path: ["meta", "is_stale"], message: "Invalid input: expected boolean" },
      ]),
    );

    expect(error).toEqual({
      status: "CUSTOM_ERROR",
      error:
        "rawResponseSchema rejected the response: data.0.stake.details.stake_account: Invalid input; meta.is_stale: Invalid input: expected boolean",
    });
  });

  it("reports a rejection of the whole response by its message alone", () => {
    const error = describeSchemaFailure(
      rejection([{ path: [], message: "Invalid input: expected array, received object" }]),
    );

    expect(error).toEqual({
      status: "CUSTOM_ERROR",
      error:
        "rawResponseSchema rejected the response: Invalid input: expected array, received object",
    });
  });

  it("keeps the rejected value out of the error: it carries wallet addresses", () => {
    const error = describeSchemaFailure(
      rejection([{ path: ["data"], message: "Invalid input" }], {
        data: [{ id: { address: "Wa11etTestAddress1111111111111111111111111111" } }],
      }),
    );

    expect(JSON.stringify(error)).not.toContain("Wa11etTestAddress");
  });
});
