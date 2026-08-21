export type DepositFormError = Readonly<{
  labelKey: string;
}>;

export function validateDepositFlow(params: {
  amount: number;
  maxAmount: number;
  hasFundingAccount: boolean;
}): DepositFormError | null {
  const { amount, maxAmount, hasFundingAccount } = params;

  if (hasFundingAccount && amount > maxAmount) {
    return { labelKey: "perpsDeposit.formErrors.amountExceedsBalance" };
  }
  return null;
}
