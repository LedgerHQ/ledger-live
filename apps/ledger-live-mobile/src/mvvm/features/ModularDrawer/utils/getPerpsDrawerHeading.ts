import {
  getPerpsUiUseCase,
  PERPS_UI_USE_CASE,
  type PerpsUiUseCase,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/uiUseCase";

export type PerpsDrawerStep = "asset" | "account";

export type PerpsDrawerHeading = {
  titleKey: string;
  descriptionKey?: string;
};

type StepHeadings = Partial<Record<PerpsDrawerStep, (hasAccounts: boolean) => PerpsDrawerHeading>>;

/** Drawer copy per perps use case and step; anything missing keeps the default copy. */
const PERPS_HEADINGS: Partial<Record<PerpsUiUseCase, StepHeadings>> = {
  [PERPS_UI_USE_CASE.fund]: {
    asset: () => ({
      titleKey: "modularDrawer.selectDepositCurrencyTitle",
      descriptionKey: "modularDrawer.selectDepositCurrencyDescription",
    }),
  },
  [PERPS_UI_USE_CASE.withdraw]: {
    asset: () => ({
      titleKey: "modularDrawer.selectWithdrawCurrencyTitle",
      descriptionKey: "modularDrawer.selectWithdrawCurrencyDescription",
    }),
  },
  [PERPS_UI_USE_CASE.receive]: {
    account: hasAccounts => ({
      titleKey: "modularDrawer.selectAccountPerpsTitle",
      descriptionKey: hasAccounts
        ? "modularDrawer.selectAccountPerpsDescription"
        : "modularDrawer.selectAccountPerpsEmptyDescription",
    }),
  },
  [PERPS_UI_USE_CASE.withdrawFrom]: {
    account: hasAccounts => ({
      titleKey: "modularDrawer.selectAccountPerpsTitle",
      descriptionKey: hasAccounts
        ? "modularDrawer.selectAccountPerpsWithdrawFromDescription"
        : "modularDrawer.selectAccountPerpsWithdrawFromEmptyDescription",
    }),
  },
};

export function getPerpsDrawerHeading(
  step: PerpsDrawerStep,
  uiUseCase: string | undefined,
  hasAccounts: boolean,
): PerpsDrawerHeading | undefined {
  const perpsUseCase = getPerpsUiUseCase(uiUseCase);
  return perpsUseCase ? PERPS_HEADINGS[perpsUseCase]?.[step]?.(hasAccounts) : undefined;
}
