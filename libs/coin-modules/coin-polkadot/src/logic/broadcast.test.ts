import { createFixtureOperation } from "../types/model.fixture";
import broadcast from "./broadcast";

const mockSubmitExtrinsic = jest.fn();

jest.mock("../network", () => {
  return {
    submitExtrinsic: (arg: any) => mockSubmitExtrinsic(arg),
  };
});

describe("broadcast", () => {
  it("calls explorer for broadcast operation", async () => {
    // WHEN
    await broadcast({
      signedOperation: { signature: "SIGNATURE", operation: createFixtureOperation() },
    });

    // THEN
    expect(mockSubmitExtrinsic).toHaveBeenCalledTimes(1);
    expect(mockSubmitExtrinsic.mock.lastCall[0]).toBe("SIGNATURE");
  });

  it("updates the signed operation", async () => {
    // GIVEN
    const operation = createFixtureOperation();

    // WHEN
    const result = await broadcast({ signedOperation: { signature: "SIGNATURE", operation } });

    // THEN
    expect(result).not.toEqual(operation);
    expect(result.hash).not.toEqual(operation.hash);
  });
});
