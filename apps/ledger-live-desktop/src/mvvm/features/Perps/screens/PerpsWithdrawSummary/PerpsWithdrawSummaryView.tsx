import React from "react";
import { useTranslation } from "react-i18next";
import { Button, DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo as LedgerIcon } from "@ledgerhq/lumen-ui-react/symbols";
import { PerpsReviewSection } from "LLD/features/Perps/components/PerpsReviewSection";
import type { PerpsWithdrawSummaryViewModel } from "./usePerpsWithdrawSummaryViewModel";

export function PerpsWithdrawSummaryView({
  swapDetails,
  withdrawDetails,
  canWithdraw,
  handleBack,
  handleWithdraw,
}: Readonly<PerpsWithdrawSummaryViewModel>) {
  const { t } = useTranslation();

  return (
    <>
      <DialogHeader
        density="expanded"
        title={t("perpsReview.withdrawTitle")}
        description={t("perpsReview.withdrawSubtitle")}
        className="px-16!"
        onBack={handleBack}
      />
      <DialogBody className="flex flex-col gap-24 px-16! pb-24!">
        <PerpsReviewSection titleKey="perpsReview.swapDetailTitle" details={swapDetails} />
        <PerpsReviewSection titleKey="perpsReview.withdrawDetailTitle" details={withdrawDetails} />
        <Button
          appearance="base"
          size="lg"
          className="w-full"
          onClick={handleWithdraw}
          disabled={!canWithdraw}
          data-testid="perps-withdraw-cta"
          icon={LedgerIcon}
        >
          {t("perpsReview.withdrawCTA")}
        </Button>
      </DialogBody>
    </>
  );
}
