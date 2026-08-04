export type DepositFormError = Readonly<{
  isVisible: boolean;
  labelKey: string;
}>;

export function validateDepositFlow(params: {
  amount: number;
  maxAmount: number;
}): DepositFormError | null {
  const { amount, maxAmount } = params;

  if (amount <= 0) {
    return { isVisible: false, labelKey: "perpsDeposit.formErrors.enterAmount" };
  }
  if (amount < 5) {
    return { isVisible: true, labelKey: "perpsDeposit.formErrors.minDeposit" };
  }
  if (amount > maxAmount) {
    return { isVisible: true, labelKey: "perpsDeposit.formErrors.amountExceedsBalance" };
  }
  return null;
}
