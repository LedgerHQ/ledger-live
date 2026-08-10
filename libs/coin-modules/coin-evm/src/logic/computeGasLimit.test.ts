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

    describe("configurable floor parameters (EIP-7976)", () => {
      const defaultGasLimit = BigInt(DEFAULT_GAS_LIMIT.toFixed(0));
      const CALLDATA_68_BYTES =
        "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000000";
      const EIP_7976 = { gasPerToken: 16, zeroByteTokens: 4 };

      it("should charge 64 gas per byte with the EIP-7976 parameters", () => {
        const gasLimit = computeEIP7623GasLimit(
          defaultGasLimit,
          Buffer.from(CALLDATA_68_BYTES, "hex"),
          EIP_7976,
        );

        // 21000 + 64 * 68
        expect(gasLimit).toEqual(25352n);
      });

      it("should charge 64 gas per byte regardless of the byte values", () => {
        const allZeros = computeEIP7623GasLimit(defaultGasLimit, Buffer.alloc(32, 0x00), EIP_7976);
        const allNonZeros = computeEIP7623GasLimit(
          defaultGasLimit,
          Buffer.alloc(32, 0xff),
          EIP_7976,
        );

        // 21000 + 64 * 32
        expect(allZeros).toEqual(23048n);
        expect(allNonZeros).toEqual(23048n);
      });

      it("should keep the EIP-7623 values when no parameter is given", () => {
        const gasLimit = computeEIP7623GasLimit(
          defaultGasLimit,
          Buffer.from(CALLDATA_68_BYTES, "hex"),
        );

        expect(gasLimit).toEqual(22400n);
      });

      it.each([
        { label: "a float", params: { gasPerToken: 16.5, zeroByteTokens: 4.2 } },
        { label: "a negative", params: { gasPerToken: -16, zeroByteTokens: -4 } },
        { label: "zero", params: { gasPerToken: 0, zeroByteTokens: 0 } },
        { label: "NaN", params: { gasPerToken: NaN, zeroByteTokens: NaN } },
        { label: "undefined", params: { gasPerToken: undefined, zeroByteTokens: undefined } },
      ])("should fall back to the EIP-7623 defaults when the config holds $label", ({ params }) => {
        const gasLimit = computeEIP7623GasLimit(
          defaultGasLimit,
          Buffer.from(CALLDATA_68_BYTES, "hex"),
          params,
        );

        expect(gasLimit).toEqual(22400n);
      });

      it.each([1, 2, 3])(
        "should never go below intrinsic gas when gasPerToken is misconfigured to %i",
        gasPerToken => {
          const gasLimit = computeEIP7623GasLimit(
            defaultGasLimit,
            Buffer.from(CALLDATA_68_BYTES, "hex"),
            { gasPerToken },
          );

          // 21000 + 4 * 44 zero bytes + 16 * 24 non-zero ones
          expect(gasLimit).toEqual(21560n);
        },
      );

      it("should under-estimate zero bytes when only gasPerToken is raised", () => {
        const gasLimit = computeEIP7623GasLimit(
          defaultGasLimit,
          Buffer.from(CALLDATA_68_BYTES, "hex"),
          { gasPerToken: 16 },
        );

        // 21000 + 16 * 140 tokens, versus 25352n for the full 64/64 migration
        expect(gasLimit).toEqual(23240n);
      });
    });
  });
});
