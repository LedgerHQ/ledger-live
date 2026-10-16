import BigNumber from "bignumber.js";
import { z } from "zod";
import { DecimalSchema } from "./schemas";

type WithdrawApiErrorFields = {
  status?: number;
  code?: string;
};

export class WithdrawApiError extends Error {
  override name = "WithdrawApiError";
  status?: number;
  code?: string;

  constructor(message?: string, { status, code }: WithdrawApiErrorFields = {}) {
    super(message || "WithdrawApiError");
    this.status = status;
    this.code = code;
  }
}

export class WithdrawMinimumAmountError extends WithdrawApiError {
  override name = "WithdrawMinimumAmountError";
  minAmount?: BigNumber;

  constructor(message?: string, fields?: WithdrawApiErrorFields & { minAmount?: BigNumber }) {
    super(message, fields);
    this.minAmount = fields?.minAmount;
  }
}

export class WithdrawLowLiquidityError extends WithdrawApiError {
  override name = "WithdrawLowLiquidityError";
}

export class WithdrawAddressScreeningError extends WithdrawApiError {
  override name = "WithdrawAddressScreeningError";
}

/** Submit outcome unknown: check the status, never resubmit. */
export class WithdrawSubmitUnknownOutcomeError extends WithdrawApiError {
  override name = "WithdrawSubmitUnknownOutcomeError";
}

// TODO(LIVE-39366): placeholder error body, confirm with the backend.
const ErrorBodySchema = z.looseObject({
  code: z.string().optional(),
  message: z.string().optional(),
  additionalFields: z.looseObject({ minAmount: z.unknown().optional() }).optional(),
});

export function toWithdrawError({
  status,
  body,
}: {
  status: number;
  body: unknown;
}): WithdrawApiError {
  const parsed = ErrorBodySchema.safeParse(body);
  const code = parsed.success ? parsed.data.code : undefined;
  const message = (parsed.success && parsed.data.message) || `Withdraw API HTTP ${status}`;
  const fields = { status, code };

  switch (code) {
    case "FROM_CURRENCY_MINIMUM_AMOUNT_ERROR": {
      const minAmount = DecimalSchema.safeParse(
        parsed.success ? parsed.data.additionalFields?.minAmount : undefined,
      );
      return new WithdrawMinimumAmountError(message, {
        ...fields,
        minAmount: minAmount.success ? minAmount.data : undefined,
      });
    }
    case "SWAP_QUOTE_LOW_LIQUIDITY":
      return new WithdrawLowLiquidityError(message, fields);
    case "ADDRESS_SCREENING_FAILED":
    case "invalidDestinationAddress":
      return new WithdrawAddressScreeningError(message, fields);
    case "SUBMIT_FAILED_ERROR":
      return new WithdrawSubmitUnknownOutcomeError(message, fields);
    default:
      return new WithdrawApiError(message, fields);
  }
}
