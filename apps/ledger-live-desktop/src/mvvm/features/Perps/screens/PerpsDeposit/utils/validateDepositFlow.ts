export type DepositFormError = Readonly<{
  labelKey: string;
}>;

export function validateDepositFlow(params: {
  amount: number;
  maxAmount: number | null;
  hasFundingAccount: boolean;
}): DepositFormError | null {
  const { amount, maxAmount, hasFundingAccount } = params;

  if (hasFundingAccount && maxAmount !== null && amount > maxAmount) {
    return { labelKey: "perpsDeposit.formErrors.amountExceedsBalance" };
  }
  return null;
}
