import {
  MultiversXDecimalsLimitReached,
  MultiversXMinDelegatedAmountError,
  MultiversXMinUndelegatedAmountError,
  MultiversXDelegationBelowMinimumError,
  NotEnoughEGLDForFees,
} from "./errors";

describe("MultiversX custom errors", () => {
  describe("MultiversXDecimalsLimitReached", () => {
    it("creates an error with correct name", () => {
      const error = new MultiversXDecimalsLimitReached();
      expect(error.name).toBe("MultiversXDecimalsLimitReached");
    });

    it("is an instance of Error", () => {
      const error = new MultiversXDecimalsLimitReached();
      expect(error).toBeInstanceOf(Error);
    });

    it("accepts a custom message", () => {
      const error = new MultiversXDecimalsLimitReached("custom message");
      expect(error.message).toBe("custom message");
    });
  });

  describe("MultiversXMinDelegatedAmountError", () => {
    it("creates an error with correct name", () => {
      const error = new MultiversXMinDelegatedAmountError();
      expect(error.name).toBe("MultiversXMinDelegatedAmountError");
    });

    it("is an instance of Error", () => {
      const error = new MultiversXMinDelegatedAmountError();
      expect(error).toBeInstanceOf(Error);
    });

    it("accepts a custom message", () => {
      const error = new MultiversXMinDelegatedAmountError("minimum not met");
      expect(error.message).toBe("minimum not met");
    });
  });

  describe("MultiversXMinUndelegatedAmountError", () => {
    it("creates an error with correct name", () => {
      const error = new MultiversXMinUndelegatedAmountError();
      expect(error.name).toBe("MultiversXMinUndelegatedAmountError");
    });

    it("is an instance of Error", () => {
      const error = new MultiversXMinUndelegatedAmountError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("MultiversXDelegationBelowMinimumError", () => {
    it("creates an error with correct name", () => {
      const error = new MultiversXDelegationBelowMinimumError();
      expect(error.name).toBe("MultiversXDelegationBelowMinimumError");
    });

    it("is an instance of Error", () => {
      const error = new MultiversXDelegationBelowMinimumError();
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("NotEnoughEGLDForFees", () => {
    it("creates an error with correct name", () => {
      const error = new NotEnoughEGLDForFees();
      expect(error.name).toBe("NotEnoughEGLDForFees");
    });

    it("is an instance of Error", () => {
      const error = new NotEnoughEGLDForFees();
      expect(error).toBeInstanceOf(Error);
    });

    it("accepts a custom message", () => {
      const error = new NotEnoughEGLDForFees("insufficient balance for fees");
      expect(error.message).toBe("insufficient balance for fees");
    });
  });

  describe("error throwing", () => {
    it("can be thrown and caught", () => {
      expect(() => {
        throw new MultiversXDecimalsLimitReached("test error");
      }).toThrow(MultiversXDecimalsLimitReached);
    });

    it("preserves stack trace", () => {
      const error = new NotEnoughEGLDForFees("test");
      expect(error.stack).toBeDefined();
    });
  });
});
