import React from "react";
import { useTranslation } from "react-i18next";
import { Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-react";
import { PerpsReviewDetailRow } from "./PerpsReviewDetailRow";

export type PerpsReviewDetailItem = Readonly<{
  labelKey: string;
  value: string;
  testID?: string;
}>;

type PerpsReviewSectionProps = Readonly<{
  titleKey: string;
  details: readonly PerpsReviewDetailItem[];
}>;

export function PerpsReviewSection({ titleKey, details }: PerpsReviewSectionProps) {
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
