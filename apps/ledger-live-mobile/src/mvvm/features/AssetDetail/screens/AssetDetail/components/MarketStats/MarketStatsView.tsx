import React from "react";
import { Box, Text, Tooltip, TooltipTrigger, TooltipContent } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import { SectionContentState } from "../SectionContentState";
import { STAT_KEYS } from "./useMarketStatsViewModel";

type StatRow = {
  key: string;
  label: string;
  value: string;
  tooltip?: { title: string; content: string };
};

type Props = Readonly<{
  stats: readonly StatRow[];
  isLoading: boolean;
  isError: boolean;
  hasData: boolean;
  onTooltipOpen: (statName: string, open: boolean) => void;
}>;

export function MarketStatsView({ stats, isLoading, isError, hasData, onTooltipOpen }: Props) {
  const { t } = useTranslation();

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.marketStats} lx={containerStyle}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {t("assetDetail.marketStats.title")}
      </Text>
      <SectionContentState
        isLoading={isLoading}
        isError={isError}
        hasData={hasData}
        errorMessage={t("assetDetail.marketStats.error")}
        skeletonKeys={STAT_KEYS}
        listStyle={listStyle}
        skeletonStyle={skeletonRowStyle}
      >
        <Box lx={listStyle}>
          {stats.map(stat => (
            <Box key={stat.key} lx={rowStyle}>
              <Box lx={labelContainerStyle}>
                <Text typography="body2" lx={{ color: "muted" }}>
                  {stat.label}
                </Text>
                {stat.tooltip && (
                  <Tooltip onOpenChange={open => onTooltipOpen(stat.key, open)}>
                    <TooltipTrigger>
                      <Information size={16} color="muted" />
                    </TooltipTrigger>
                    <TooltipContent
                      title={stat.tooltip.title}
                      content={
                        <Text typography="body2" lx={{ color: "muted" }}>
                          {stat.tooltip.content}
                        </Text>
                      }
                    />
                  </Tooltip>
                )}
              </Box>
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                {stat.value}
              </Text>
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
  gap: "s12",
};

const rowStyle: LumenViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
};

const labelContainerStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s4",
};

const skeletonRowStyle: LumenViewStyle = {
  height: "s24",
  backgroundColor: "surface",
  borderRadius: "sm",
};
