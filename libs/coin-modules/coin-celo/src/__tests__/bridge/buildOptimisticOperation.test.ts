import BigNumber from "bignumber.js";
import { buildOptimisticOperation } from "../../bridge/buildOptimisticOperation";
import { accountFixture, transactionFixture } from "../../bridge/fixtures";

describe("buildOptimisticOperation", () => {
  it("should build a proper send operation", () => {
    const optimisticOperation = buildOptimisticOperation(
      accountFixture,
      { ...transactionFixture, mode: "send" },
      BigNumber(2),
    );

    expect(optimisticOperation.value).toEqual(BigNumber(12));
    expect(optimisticOperation.type).toEqual("OUT");
    expect(optimisticOperation.extra.celoSourceValidator).toEqual(undefined);
  });

  it("should build a proper vote operation", () => {
    const optimisticOperation = buildOptimisticOperation(
      accountFixture,
      { ...transactionFixture, mode: "vote" },
      BigNumber(2),
    );

    expect(optimisticOperation.value).toEqual(BigNumber(10));
    expect(optimisticOperation.type).toEqual("VOTE");
    expect(optimisticOperation.extra.celoSourceValidator).toEqual("recipient");
  });
});
