import React from "react";
import { Box, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { PerpsReviewDetailRow } from "./PerpsReviewDetailRow";
import type { PerpsReviewDetailItem } from "@ledgerhq/live-common/wallet-api/Perps/reviewDetails";

type PerpsReviewSectionProps = Readonly<{
  titleKey: string;
  details: readonly PerpsReviewDetailItem[];
}>;

export function PerpsReviewSection({ titleKey, details }: PerpsReviewSectionProps) {
  const { t } = useTranslation();

  return (
    <Box lx={{ gap: "s12" }}>
      <Subheader>
        <SubheaderRow lx={{ marginBottom: "s4" }}>
          <SubheaderTitle>{t(titleKey)}</SubheaderTitle>
        </SubheaderRow>
      </Subheader>
      <Box lx={{ gap: "s8" }}>
        {details.map(detail => (
          <PerpsReviewDetailRow
            key={detail.labelKey}
            label={t(detail.labelKey)}
            value={detail.value}
            testID={detail.testID}
          />
        ))}
      </Box>
    </Box>
  );
}
