import { log } from "@ledgerhq/logs";
import { NamedSchemaError } from "@reduxjs/toolkit/query";
import { onSchemaFailure } from "./onSchemaFailure";

jest.mock("@ledgerhq/logs");

const mockedLog = jest.mocked(log);

describe("onSchemaFailure", () => {
  beforeEach(() => {
    mockedLog.mockClear();
  });

  it("should log the endpoint and error issues", () => {
    const issues = [{ message: "Expected array, received object", path: [] }];
    const error = new NamedSchemaError(issues, { bad: "data" }, "responseSchema", undefined);

    onSchemaFailure({ apiName: "testApi", endpoint: "TEST_ENDPOINT", error });

    expect(mockedLog).toHaveBeenCalledWith("testApi", "Invalid TEST_ENDPOINT response schema:", {
      issues,
    });
  });
});
