import React from "react";
import {
  Box,
  Text,
  DescriptionItem,
  DescriptionItemLeading,
  DescriptionItemLabel,
  DescriptionItemTrailing,
  DescriptionItemValue,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import { SectionContentState } from "../SectionContentState";
import { SectionSkeleton } from "../SectionSkeleton";

type PriceRecord = {
  id: string;
  label: string;
  value: string;
  date: string;
  relativeTime: string;
  changePercentage: string;
};

type Props = Readonly<{
  records: readonly PriceRecord[];
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
}>;

export function PricePerformanceView({ records, isLoading, isError, hasData }: Props) {
  const { t } = useTranslation();

  if (isLoading && !hasData) {
    return (
      <Box testID={ASSET_DETAIL_TEST_IDS.pricePerformance}>
        <SectionSkeleton rows={1} rowHeight="s56" />
      </Box>
    );
  }

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.pricePerformance} lx={containerStyle}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {t("assetDetail.pricePerformance.title")}
      </Text>
      <SectionContentState
        isError={isError}
        hasData={hasData}
        errorMessage={t("assetDetail.pricePerformance.error")}
      >
        <Box lx={listStyle}>
          {records.map(record => (
            <DescriptionItem key={record.id} size="md">
              <DescriptionItemLeading>
                <Box lx={leadingColumnStyle}>
                  <DescriptionItemLabel>{record.label}</DescriptionItemLabel>
                  <Text typography="body3" lx={{ color: "muted" }}>
                    {record.date} ({record.relativeTime})
                  </Text>
                </Box>
              </DescriptionItemLeading>
              <DescriptionItemTrailing>
                <Box lx={trailingColumnStyle}>
                  <DescriptionItemValue>{record.value}</DescriptionItemValue>
                  <Text typography="body3" lx={{ color: "muted" }}>
                    {record.changePercentage}
                  </Text>
                </Box>
              </DescriptionItemTrailing>
            </DescriptionItem>
          ))}
        </Box>
      </SectionContentState>
    </Box>
  );
}

const containerStyle: LumenViewStyle = {
  gap: "s16",
};

const listStyle: LumenViewStyle = {
  gap: "s16",
  marginBottom: "s12",
};

const leadingColumnStyle: LumenViewStyle = {
  flex: 1,
  minWidth: "s0",
  gap: "s2",
};

const trailingColumnStyle: LumenViewStyle = {
  alignItems: "flex-end",
  gap: "s2",
};
