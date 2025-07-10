import React from "react";
import styled, { keyframes, css } from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { rgba } from "~/renderer/styles/helpers";
import { Trophy, TrophyCategory } from "./types/index";
import { Account } from "@ledgerhq/types-live";

// Animation keyframes
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`;

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(138, 128, 219, 0.3); }
  50% { box-shadow: 0 0 30px rgba(138, 128, 219, 0.5); }
`;

const Container = styled(Box)`
  display: grid;
  gap: 32px;
`;

const CategorySection = styled(Box)`
  margin-bottom: 32px;
`;

const CategoryTitle = styled(Text)`
  font-size: 20px;
  font-weight: 600;
  color: ${p => p.theme.colors.palette.text.shade100};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CategoryIcon = styled(Box)`
  width: 24px;
  height: 24px;
  background: ${p => p.theme.colors.palette.primary.main};
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const TrophiesGrid = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

const TrophyCard = styled(Box)<{ isEarned: boolean; isRare?: boolean }>`
  background: ${p =>
    p.isEarned
      ? p.theme.colors.palette.background.paper
      : rgba(p.theme.colors.palette.background.paper, 0.6)};
  border-radius: 16px;
  padding: 24px;
  border: 1px solid
    ${p => (p.isEarned ? p.theme.colors.palette.primary.main : p.theme.colors.palette.divider)};
  box-shadow: ${p =>
    p.isEarned
      ? `0 4px 16px ${rgba(p.theme.colors.palette.primary.main, 0.12)}`
      : `0 2px 8px ${rgba(p.theme.colors.palette.text.shade100, 0.04)}`};
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  opacity: ${p => (p.isEarned ? 1 : 0.7)};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${p =>
      p.isEarned
        ? `0 8px 24px ${rgba(p.theme.colors.palette.primary.main, 0.2)}`
        : `0 4px 16px ${rgba(p.theme.colors.palette.text.shade100, 0.08)}`};
  }

  ${p =>
    p.isRare &&
    p.isEarned &&
    css`
      animation: ${glow} 3s ease-in-out infinite;
      background: linear-gradient(
        135deg,
        ${p.theme.colors.palette.primary.main}10,
        ${p.theme.colors.palette.secondary.main}10
      );
    `}
`;

const TrophyIconContainer = styled(Box)<{ isEarned: boolean; isRare?: boolean }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${p =>
    p.isEarned
      ? `linear-gradient(135deg, ${p.theme.colors.palette.primary.main}, ${p.theme.colors.palette.secondary.main})`
      : p.theme.colors.palette.text.shade20};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: ${p => (p.isEarned ? "white" : p.theme.colors.palette.text.shade40)};
  transition: all 0.3s ease;

  ${p =>
    p.isEarned &&
    css`
      animation: ${float} 3s ease-in-out infinite;
    `}

  ${p =>
    p.isRare &&
    p.isEarned &&
    css`
      animation:
        ${float} 3s ease-in-out infinite,
        ${pulse} 2s ease-in-out infinite;
    `}
`;

const TrophyTitle = styled(Text)<{ isEarned: boolean }>`
  font-size: 16px;
  font-weight: 600;
  color: ${p =>
    p.isEarned ? p.theme.colors.palette.text.shade100 : p.theme.colors.palette.text.shade50};
  margin-bottom: 8px;
`;

const TrophyDescription = styled(Text)<{ isEarned: boolean }>`
  font-size: 13px;
  color: ${p =>
    p.isEarned ? p.theme.colors.palette.text.shade60 : p.theme.colors.palette.text.shade40};
  line-height: 1.4;
  margin-bottom: 12px;
`;

const TrophyProgress = styled(Box)`
  margin-top: 12px;
`;

const ProgressBar = styled(Box)<{ progress: number }>`
  height: 4px;
  background: ${p => p.theme.colors.palette.background.default};
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${p => p.progress}%;
    background: linear-gradient(
      90deg,
      ${p => p.theme.colors.palette.primary.main},
      ${p => p.theme.colors.palette.secondary.main}
    );
    border-radius: 2px;
    transition: width 0.3s ease;
  }
`;

const ProgressText = styled(Text)`
  font-size: 11px;
  color: ${p => p.theme.colors.palette.text.shade50};
  margin-top: 4px;
`;

const EarnedDate = styled(Text)`
  font-size: 11px;
  color: ${p => p.theme.colors.palette.primary.main};
  font-weight: 500;
`;

const RarityBadge = styled(Box)<{ rarity: string }>`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${p => {
    switch (p.rarity) {
      case "legendary":
        return `
          background: linear-gradient(135deg, #FFD700, #FFA500);
          color: #8B4513;
        `;
      case "rare":
        return `
          background: linear-gradient(135deg, #9D4EDD, #7B2CBF);
          color: white;
        `;
      case "uncommon":
        return `
          background: linear-gradient(135deg, #4CC9F0, #4895EF);
          color: white;
        `;
      default:
        return `
          background: ${p.theme.colors.palette.text.shade20};
          color: ${p.theme.colors.palette.text.shade60};
        `;
    }
  }}
`;

const ShimmerEffect = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    ${p => rgba(p.theme.colors.palette.primary.main, 0.1)},
    transparent
  );
  ${css`
    animation: ${shimmer} 2s infinite;
  `}
`;

// Helper functions
const calculateTrophyProgress = (trophy: Trophy, accounts: Account[]) => {
  if (!trophy.progress) return 0;
  const current = trophy.progress(accounts);
  const target = trophy.target || 100;
  return Math.min((current / target) * 100, 100);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

type Props = {
  filteredCategories: TrophyCategory[];
  earnedTrophies: Set<string>;
  accounts: Account[];
};

export default function CategoriesGrid({ filteredCategories, earnedTrophies, accounts }: Props) {
  return (
    <Container>
      {filteredCategories.map(category => (
        <CategorySection key={category.id}>
          <CategoryTitle>
            <CategoryIcon>{category.icon}</CategoryIcon>
            {category.title}
          </CategoryTitle>

          <TrophiesGrid>
            {category.trophies.map(trophy => {
              const isEarned = earnedTrophies.has(trophy.id);
              const isRare = trophy.rarity === "rare" || trophy.rarity === "legendary";
              const progress = trophy.progress ? calculateTrophyProgress(trophy, accounts) : 0;

              return (
                <TrophyCard key={trophy.id} isEarned={isEarned} isRare={isRare}>
                  {isEarned && isRare && <ShimmerEffect />}

                  <RarityBadge rarity={trophy.rarity}>{trophy.rarity}</RarityBadge>

                  <TrophyIconContainer isEarned={isEarned} isRare={isRare}>
                    {trophy.icon}
                  </TrophyIconContainer>

                  <TrophyTitle isEarned={isEarned}>{trophy.title}</TrophyTitle>

                  <TrophyDescription isEarned={isEarned}>{trophy.description}</TrophyDescription>

                  {isEarned ? (
                    <EarnedDate>
                      Earned{" "}
                      {formatDate(new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000))}
                    </EarnedDate>
                  ) : (
                    trophy.progress && (
                      <TrophyProgress>
                        <ProgressBar progress={progress} />
                        <ProgressText>{Math.round(progress)}% complete</ProgressText>
                      </TrophyProgress>
                    )
                  )}
                </TrophyCard>
              );
            })}
          </TrophiesGrid>
        </CategorySection>
      ))}
    </Container>
  );
}
