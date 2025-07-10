import React from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import { TROPHY_CATEGORIES } from "./data";

const Container = styled(Box)`
  display: flex;
  flex-direction: row;
  gap: 14px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const FilterTab = styled(Box)<{ isActive: boolean }>`
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  ${p =>
    p.isActive
      ? `
    background: ${p.theme.colors.palette.primary.main};
    color: white;
  `
      : `
    background: ${p.theme.colors.palette.background.paper};
    color: ${p.theme.colors.palette.text.shade60};
    border: 1px solid ${p.theme.colors.palette.divider};
    
    &:hover {
      background: ${p.theme.colors.palette.background.default};
      color: ${p.theme.colors.palette.text.shade80};
    }
  `}
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
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
};

export default function FilterTabs({ trophyStats, selectedFilter, setSelectedFilter }: Props) {
  return (
    <Container>
      <FilterTab isActive={selectedFilter === "all"} onClick={() => setSelectedFilter("all")}>
        All Trophies
      </FilterTab>
      <FilterTab isActive={selectedFilter === "earned"} onClick={() => setSelectedFilter("earned")}>
        Earned ({trophyStats.earnedCount})
      </FilterTab>
      <FilterTab
        isActive={selectedFilter === "unearned"}
        onClick={() => setSelectedFilter("unearned")}
      >
        Unearned ({trophyStats.totalTrophies - trophyStats.earnedCount})
      </FilterTab>
      {TROPHY_CATEGORIES.map(category => (
        <FilterTab
          key={category.id}
          isActive={selectedFilter === category.id}
          onClick={() => setSelectedFilter(category.id)}
        >
          {category.title}
        </FilterTab>
      ))}
    </Container>
  );
}
