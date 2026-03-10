import { DEFAULT_GAS_LIMIT } from "../utils";
import { computeEIP7623GasLimit } from "./computeGasLimit";

describe("computeGasLimit", () => {
  describe("computeEIP7623GasLimit", () => {
    it.each([
      {
        callData: "",
        expectedGasLimit: 21000n,
      },
      {
        callData:
          "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000000",
        expectedGasLimit: 22400n,
      },
      {
        callData:
          "a9059cbb000000000000000000000000d8ff72a08408b97655ee94381b8fa24ba7d6f5ac0000000000000000000000000000000000000000000000000000000000895440",
        expectedGasLimit: 22490n,
      },
      {
        callData:
          "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000b71b00",
        expectedGasLimit: 22460n,
      },
    ])("should compute gas limit according to EIP-7623", ({ callData, expectedGasLimit }) => {
      const gasLimit = computeEIP7623GasLimit(
        BigInt(DEFAULT_GAS_LIMIT.toFixed(0)),
        Buffer.from(callData, "hex"),
      );
      expect(gasLimit).toEqual(expectedGasLimit);
    });
  });
});
