import { createStepError, CustomErrorType, parseError, StepError } from "./parser";
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

type StepExpectation = {
  step: StepError;
  ExpectedError: new (err?: Error) => SwapError;
  swapCode: string;
};

const STEP_EXPECTATIONS: StepExpectation[] = [
  { step: StepError.NONCE, ExpectedError: NonceStepError, swapCode: "swap001" },
  { step: StepError.PAYLOAD, ExpectedError: PayloadStepError, swapCode: "swap002" },
  { step: StepError.SIGNATURE, ExpectedError: SignatureStepError, swapCode: "swap003" },
  {
    step: StepError.IGNORED_SIGNATURE,
    ExpectedError: IgnoredSignatureStepError,
    swapCode: "swap003Ignored",
  },
  { step: StepError.CHECK_FUNDS, ExpectedError: NotEnoughFunds, swapCode: "swap004" },
  { step: StepError.LIST_ACCOUNT, ExpectedError: ListAccountError, swapCode: "swap005" },
  { step: StepError.LIST_CURRENCY, ExpectedError: ListCurrencyError, swapCode: "swap006" },
  { step: StepError.UNKNOWN_ACCOUNT, ExpectedError: UnknownAccountError, swapCode: "swap007" },
  { step: StepError.PAYIN_EXTRA_ID, ExpectedError: PayinExtraIdError, swapCode: "swap010" },
];

const mockDownstreamError = new Error("error message");

describe("parseError", () => {
  it.each(STEP_EXPECTATIONS)(
    "$step - returns generic error when customErrorType is not passed in",
    ({ step }) => {
      const typedStep = step as StepError;

      const error = parseError({
        error: mockDownstreamError,
        step: typedStep,
      });

      expect(error).toBe(mockDownstreamError);
    },
  );

  it.each(STEP_EXPECTATIONS)(
    "$step - returns specific swap error when customErrorType is 'swap'",
    ({ step, ExpectedError, swapCode }) => {
      const typedStep = step as StepError;

      const error = parseError({
        error: mockDownstreamError,
        step: typedStep,
        customErrorType: CustomErrorType.SWAP,
      }) as SwapError;

      expect(error).toBeInstanceOf(ExpectedError);
      expect(error.cause.swapCode).toBe(swapCode);
    },
  );
});

describe("createStepError", () => {
  it("returns downstream error when no step is supplied", () => {
    expect(createStepError({ error: mockDownstreamError })).toBe(mockDownstreamError);
  });

  it.each(STEP_EXPECTATIONS)(
    "$step - wraps downstream error with appropriate swap error",
    ({ step, ExpectedError, swapCode }) => {
      const typedStep = step as StepError;
      const wrapped = createStepError({ error: mockDownstreamError, step: typedStep }) as SwapError;

      expect(wrapped).toBeInstanceOf(ExpectedError);
      expect(wrapped.cause.swapCode).toBe(swapCode);
    },
  );
});
