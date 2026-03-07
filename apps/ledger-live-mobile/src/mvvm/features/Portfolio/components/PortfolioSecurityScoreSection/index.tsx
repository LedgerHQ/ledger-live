import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { Text } from "@ledgerhq/native-ui";
import storage from "LLM/storage";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";

/* eslint-disable i18next/no-literal-string */

const STORAGE_KEY = "hackathon.h1.securityScore.lastCheckIn";
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SCORE = 75;

function getScore(lastCheckIn: number | null): number {
  if (!lastCheckIn) return DEFAULT_SCORE;
  const weeksSinceCheckIn = Math.floor((Date.now() - lastCheckIn) / MS_PER_WEEK);
  return Math.max(0, 100 - weeksSinceCheckIn);
}

export const PortfolioSecurityScoreSection = () => {
  const [lastCheckIn, setLastCheckIn] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    storage.get<number | string>(STORAGE_KEY).then(value => {
      if (!mounted || value == null) return;
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        setLastCheckIn(parsed);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const score = useMemo(() => getScore(lastCheckIn), [lastCheckIn]);
  const scoreLabel = score >= 80 ? "Good" : "Check recommended";

  const onCheckIn = useCallback(() => {
    const timestamp = Date.now();
    setLastCheckIn(timestamp);
    void storage.save(STORAGE_KEY, timestamp);
  }, []);

  return (
    <SectionContainer
      py="0"
      isFirst={false}
      key="securityScoreSection"
      testID="security-score-section"
    >
      <Box p={6} bg="neutral.c20" borderRadius={4}>
        <Text variant="h5">Vault Health Score</Text>
        <Text variant="small" color="neutral.c80">
          {scoreLabel}
        </Text>
        <Text variant="large" fontWeight="semiBold" mt={4}>
          {score}
        </Text>
        <Text variant="small" color="neutral.c80" mt={2} mb={4}>
          {lastCheckIn
            ? `Last check-in: ${new Date(lastCheckIn).toLocaleString()}`
            : "Last check-in: never"}
        </Text>
        <Button appearance="main" size="sm" onPress={onCheckIn}>
          Firmware checked
        </Button>
      </Box>
    </SectionContainer>
  );
};
