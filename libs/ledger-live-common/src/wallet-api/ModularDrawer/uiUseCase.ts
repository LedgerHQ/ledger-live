/**
 * `namespace:variant` hints a live-app passes to `account.request` to pick the
 * wording of the asset and account selection screens.
 */
export const PERPS_UI_USE_CASE = {
  /** Perps account pick with no stated variant. */
  legacy: "perpetuals",
  /** Account a deposit lands in. */
  receive: "perpetuals:receive",
  /** Account a deposit is funded from. */
  fund: "perpetuals:fund",
  /** Account a withdrawal lands in. */
  withdraw: "perpetuals:withdraw",
  /** HyperCore account a withdrawal leaves from. */
  withdrawFrom: "perpetuals:withdrawFrom",
} as const;

export type PerpsUiUseCase = (typeof PERPS_UI_USE_CASE)[keyof typeof PERPS_UI_USE_CASE];

const KNOWN_PERPS_UI_USE_CASES: readonly PerpsUiUseCase[] = Object.values(PERPS_UI_USE_CASE);

export function getPerpsUiUseCase(uiUseCase?: string): PerpsUiUseCase | undefined {
  const known = KNOWN_PERPS_UI_USE_CASES.find(useCase => useCase === uiUseCase);
  if (known) return known;
  return uiUseCase?.split(":")[0] === PERPS_UI_USE_CASE.legacy
    ? PERPS_UI_USE_CASE.legacy
    : undefined;
}
