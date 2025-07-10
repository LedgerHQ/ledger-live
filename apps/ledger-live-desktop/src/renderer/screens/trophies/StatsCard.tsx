import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { rgba } from "~/renderer/styles/helpers";

const StatsCard = styled(Box)`
  background: ${p => p.theme.colors.palette.background.paper};
  border-radius: 16px;
  padding: 24px;
  border: 1px solid ${p => p.theme.colors.palette.divider};
  box-shadow: 0 2px 8px ${p => rgba(p.theme.colors.palette.text.shade100, 0.04)};
  margin-bottom: 32px;
`;

const Grid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 24px;
`;

const StatItem = styled(Box)`
  text-align: center;
`;

const StatValue = styled(Text)`
  font-size: 28px;
  font-weight: 700;
  color: ${p => p.theme.colors.palette.primary.main};
  margin-bottom: 4px;
`;

const StatLabel = styled(Text)`
  font-size: 12px;
  color: ${p => p.theme.colors.palette.text.shade50};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

type Props = {
  trophyStats: {
    totalTrophies: number;
    earnedCount: number;
    completionRate: number;
    rarityCount: {
      legendary: number;
      rare: number;
      uncommon: number;
      common: number;
    };
  };
};

export default function StatsGrid({ trophyStats }: Props) {
  return (
    <StatsCard>
      <Grid>
        <StatItem>
          <StatValue>
            {trophyStats.earnedCount} / {trophyStats.totalTrophies}
          </StatValue>
          <StatLabel>Earned Trophies</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{trophyStats.completionRate}%</StatValue>
          <StatLabel>Completion Rate</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{trophyStats.rarityCount.legendary} / 6</StatValue>
          <StatLabel>Legendary</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{trophyStats.rarityCount.rare} / 6</StatValue> {/* TODO: do it dynamically */}
          <StatLabel>Rare</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{trophyStats.rarityCount.uncommon} / 7</StatValue>
          <StatLabel>Uncommon</StatLabel>
        </StatItem>
        <StatItem>
          <StatValue>{trophyStats.rarityCount.common} / 8</StatValue>
          <StatLabel>Common</StatLabel>
        </StatItem>
      </Grid>
    </StatsCard>
  );
}
