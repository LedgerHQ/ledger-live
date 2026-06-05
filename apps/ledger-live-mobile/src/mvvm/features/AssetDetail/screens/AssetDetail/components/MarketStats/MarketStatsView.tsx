import React from "react";
import {
  Box,
  Text,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DescriptionItem,
  DescriptionItemLeading,
  DescriptionItemLabel,
  DescriptionItemTrailing,
  DescriptionItemValue,
  InteractiveIcon,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Information } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { ASSET_DETAIL_TEST_IDS } from "LLM/features/AssetDetail/testIds";
import { SectionContentState } from "../SectionContentState";
import { SectionSkeleton } from "../SectionSkeleton";

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

  if (isLoading && !hasData) {
    return (
      <Box testID={ASSET_DETAIL_TEST_IDS.marketStats}>
        <SectionSkeleton rows={1} rowHeight="s56" />
      </Box>
    );
  }

  return (
    <Box testID={ASSET_DETAIL_TEST_IDS.marketStats} lx={containerStyle}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {t("assetDetail.marketStats.title")}
      </Text>
      <SectionContentState
        isError={isError}
        hasData={hasData}
        errorMessage={t("assetDetail.marketStats.error")}
      >
        <Box lx={listStyle}>
          {stats.map(stat => (
            <DescriptionItem key={stat.key} size="md">
              <DescriptionItemLeading>
                <DescriptionItemLabel>{stat.label}</DescriptionItemLabel>
                {stat.tooltip && (
                  <Tooltip onOpenChange={open => onTooltipOpen(stat.key, open)}>
                    <TooltipTrigger asChild>
                      <InteractiveIcon
                        icon={Information}
                        size={16}
                        iconType="stroked"
                        accessibilityLabel={stat.tooltip.title}
                      />
                    </TooltipTrigger>
                    <TooltipContent title={stat.tooltip.title} content={stat.tooltip.content} />
                  </Tooltip>
                )}
              </DescriptionItemLeading>
              <DescriptionItemTrailing>
                <DescriptionItemValue>{stat.value}</DescriptionItemValue>
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
  gap: "s12",
};
