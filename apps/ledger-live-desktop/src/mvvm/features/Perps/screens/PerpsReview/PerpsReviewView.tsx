import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  DialogBody,
  DialogHeader,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { LedgerLogo as LedgerIcon } from "@ledgerhq/lumen-ui-react/symbols";
import { PerpsReviewDetailRow } from "./components/PerpsReviewDetailRow";
import type { PerpsReviewDetailItem, PerpsReviewViewModel } from "./usePerpsReviewViewModel";

type PerpsReviewSectionProps = Readonly<{
  titleKey: string;
  details: readonly PerpsReviewDetailItem[];
}>;

function PerpsReviewSection({ titleKey, details }: PerpsReviewSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-12">
      <Subheader>
        <SubheaderRow className="mb-4">
          <SubheaderTitle>{t(titleKey)}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <div className="flex flex-col gap-8">
        {details.map(detail => (
          <PerpsReviewDetailRow
            key={detail.labelKey}
            label={t(detail.labelKey)}
            value={detail.value}
            testID={detail.testID}
          />
        ))}
      </div>
    </div>
  );
}

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
