import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
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
            <Box key={record.id} lx={recordStyle}>
              <Box lx={recordLeftStyle}>
                <Text typography="body2" lx={{ color: "muted" }}>
                  {record.label}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {record.date} ({record.relativeTime})
                </Text>
              </Box>
              <Box lx={recordRightStyle}>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {record.value}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {record.changePercentage}
                </Text>
              </Box>
            </Box>
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
};

const recordStyle: LumenViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const recordLeftStyle: LumenViewStyle = {
  gap: "s2",
};

const recordRightStyle: LumenViewStyle = {
  alignItems: "flex-end",
  gap: "s2",
};
