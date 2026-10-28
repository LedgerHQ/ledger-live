import React from "react";
import { useTranslation } from "react-i18next";
import { Button, DialogBody, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { LedgerLogo as LedgerIcon } from "@ledgerhq/lumen-ui-react/symbols";
import { PerpsReviewSection } from "LLD/features/Perps/components/PerpsReviewSection";
import type { PerpsReviewViewModel } from "./usePerpsReviewViewModel";

export function PerpsReviewView({
  swapDetails,
  depositDetails,
  isSubmitting,
  handleBack,
  handleDeposit,
}: Readonly<PerpsReviewViewModel>) {
  const { t } = useTranslation();

  return (
    <>
      <DialogHeader
        density="expanded"
        title={t("perpsReview.depositTitle")}
        description={t("perpsReview.depositSubtitle")}
        className="px-16!"
        onBack={handleBack}
      />
      <DialogBody className="flex flex-col gap-24 px-16! pb-24!">
        <PerpsReviewSection titleKey="perpsReview.swapDetailTitle" details={swapDetails} />
        <PerpsReviewSection titleKey="perpsReview.depositDetailTitle" details={depositDetails} />
        <Button
          appearance="base"
          size="lg"
          className="w-full"
          onClick={handleDeposit}
          disabled={isSubmitting}
          data-testid="perps-deposit-cta"
          icon={LedgerIcon}
        >
          {t("perpsReview.depositCTA")}
        </Button>
      </DialogBody>
    </>
  );
}
