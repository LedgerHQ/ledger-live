/* eslint-env jest */
import {
  IgnoredSignatureStepError,
  ListAccountError,
  ListCurrencyError,
  NonceStepError,
  NotEnoughFunds,
  PayloadStepError,
  PayinExtraIdError,
  SignatureStepError,
  SwapError,
  UnknownAccountError,
} from "./SwapError";

describe("SwapError", () => {
  it("captures nested error metadata", () => {
    const nested = new Error("payload failed");
    Object.assign(nested, { code: "E500" });

    const error = new SwapError("swap999", nested);

    expect(error).toBeInstanceOf(SwapError);
    expect(error.cause.swapCode).toBe("swap999");
    expect(error.cause.message).toBe(String(nested));
    expect(error.cause.code).toBe("E500");
    expect(error.message).toBe("payload failed");
  });

  it("defaults to swap000 when no code provided", () => {
    const error = new SwapError();

    expect(error.cause.swapCode).toBe("swap000");
    expect(error.message).toBe("undefined");
  });
});

type DerivedErrorCase = {
  label: string;
  create: (nested?: Error) => SwapError;
  swapCode: string;
  name: string;
  propagatesMessage?: boolean;
};

const DERIVED_ERROR_CASES: DerivedErrorCase[] = [
  {
    label: "NonceStepError",
    create: nested => new NonceStepError(nested),
    swapCode: "swap001",
    name: "NonceStepError",
    propagatesMessage: true,
  },
  {
    label: "PayloadStepError",
    create: nested => new PayloadStepError(nested),
    swapCode: "swap002",
    name: "PayloadStepError",
    propagatesMessage: true,
  },
  {
    label: "SignatureStepError",
    create: nested => new SignatureStepError(nested),
    swapCode: "swap003",
    name: "SignatureStepError",
    propagatesMessage: true,
  },
  {
    label: "IgnoredSignatureStepError",
    create: nested => new IgnoredSignatureStepError(nested),
    swapCode: "swap003Ignored",
    name: "SignatureStepError",
    propagatesMessage: true,
  },
  {
    label: "NotEnoughFunds",
    create: () => new NotEnoughFunds(),
    swapCode: "swap004",
    name: "NotEnoughFunds",
  },
  {
    label: "ListAccountError",
    create: nested => new ListAccountError(nested),
    swapCode: "swap005",
    name: "ListAccountError",
    propagatesMessage: true,
  },
  {
    label: "ListCurrencyError",
    create: nested => new ListCurrencyError(nested),
    swapCode: "swap006",
    name: "ListCurrencyError",
    propagatesMessage: true,
  },
  {
    label: "UnknownAccountError",
    create: nested => new UnknownAccountError(nested),
    swapCode: "swap007",
    name: "UnknownAccountError",
    propagatesMessage: true,
  },
  {
    label: "PayinExtraIdError",
    create: nested => new PayinExtraIdError(nested),
    swapCode: "swap010",
    name: "PayinExtraIdError",
    propagatesMessage: true,
  },
];

describe.each(DERIVED_ERROR_CASES)(
  "Derived $label",
  ({ create, swapCode, name, propagatesMessage }) => {
    it("inherits SwapError defaults", () => {
      const nested = new Error("step failure");
      const error = create(propagatesMessage ? nested : undefined);

      expect(error).toBeInstanceOf(SwapError);
      expect(error.name).toBe(name);
      expect(error.cause.swapCode).toBe(swapCode);

      if (propagatesMessage) {
        expect(error.message).toBe("step failure");
      }
    });
  },
);
