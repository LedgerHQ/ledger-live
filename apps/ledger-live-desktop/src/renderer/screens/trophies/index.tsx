import React, { useState, useMemo, useEffect, startTransition } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { TROPHY_CATEGORIES } from "./data";
import Header from "./Header";
import StatsGrid from "./StatsCard";
import FilterTabs from "./FilterTabs";
import CategoriesGrid from "./CategoriesGrid";

// Styled components
const Container = styled(Box)`
  min-height: 100vh;
  background: ${p => p.theme.colors.palette.background.default};
  padding: 24px 32px;
  animation: ${p => p.theme.animations.fadeIn};
`;

export default function TrophiesPage() {
  const accounts = useSelector(accountsSelector);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  // const [searchQuery, setSearchQuery] = useState<string>("");
  const [earnedTrophies, setEarnedTrophies] = useState<Set<string>>(new Set());
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Calculate earned trophies whenever accounts change
  useEffect(() => {
    // Use a small timeout to ensure this runs after the current render cycle
    const timeoutId = setTimeout(() => {
      try {
        const allTrophies = TROPHY_CATEGORIES.flatMap(category => category.trophies);
        const earnedTrophyIds = new Set<string>();

        allTrophies.forEach(trophy => {
          try {
            if (
              trophy.condition &&
              typeof trophy.condition === "function" &&
              trophy.condition(accounts)
            ) {
              earnedTrophyIds.add(trophy.id);
            }
          } catch (error) {
            // Skip trophies that have errors in their condition
            console.warn("Trophy condition error:", trophy.id, error);
          }
        });

        // Use startTransition to prevent suspension during synchronous updates
        startTransition(() => {
          setEarnedTrophies(earnedTrophyIds);
          setIsInitialized(true);
        });
      } catch (error) {
        // Fallback in case of any unexpected errors
        console.error("Error calculating trophies:", error);
        startTransition(() => {
          setEarnedTrophies(new Set());
          setIsInitialized(true);
        });
      }
    }, 10); // Small delay to ensure proper batching

    return () => clearTimeout(timeoutId);
  }, [accounts]);

  // Wrap setSelectedFilter with startTransition to prevent suspension
  const handleFilterChange = (filter: string) => {
    startTransition(() => {
      setSelectedFilter(filter);
    });
  };

  // Calculate trophy statistics based on earned trophies
  const trophyStats = useMemo(() => {
    const allTrophies = TROPHY_CATEGORIES.flatMap(category => category.trophies);
    const totalTrophies = allTrophies.length;
    const earnedCount = earnedTrophies.size;
    const rarityCount = {
      legendary: allTrophies.filter(t => t.rarity === "legendary" && earnedTrophies.has(t.id))
        .length,
      rare: allTrophies.filter(t => t.rarity === "rare" && earnedTrophies.has(t.id)).length,
      uncommon: allTrophies.filter(t => t.rarity === "uncommon" && earnedTrophies.has(t.id)).length,
      common: allTrophies.filter(t => t.rarity === "common" && earnedTrophies.has(t.id)).length,
    };

    return {
      totalTrophies,
      earnedCount,
      completionRate: Math.round((earnedCount / totalTrophies) * 100),
      rarityCount,
    };
  }, [earnedTrophies]);

  // Filter trophies based on selected filter and search query
  const filteredCategories = useMemo(() => {
    let categories = TROPHY_CATEGORIES;

    // Apply filter first
    if (selectedFilter === "earned") {
      categories = categories
        .map(category => ({
          ...category,
          trophies: category.trophies.filter(trophy => earnedTrophies.has(trophy.id)),
        }))
        .filter(category => category.trophies.length > 0);
    } else if (selectedFilter === "unearned") {
      categories = categories
        .map(category => ({
          ...category,
          trophies: category.trophies.filter(trophy => !earnedTrophies.has(trophy.id)),
        }))
        .filter(category => category.trophies.length > 0);
    } else if (selectedFilter !== "all") {
      categories = categories.filter(category => category.id === selectedFilter);
    }

    return categories;
  }, [selectedFilter, earnedTrophies]);

  return (
    <Container>
      <Header />
      {!isInitialized ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Text>Calculating trophies...</Text>
        </Box>
      ) : (
        <>
          <StatsGrid trophyStats={trophyStats} />
          <FilterTabs
            trophyStats={trophyStats}
            selectedFilter={selectedFilter}
            setSelectedFilter={handleFilterChange}
          />
          <CategoriesGrid
            filteredCategories={filteredCategories}
            earnedTrophies={earnedTrophies}
            accounts={accounts}
          />
        </>
      )}
    </Container>
  );
}
