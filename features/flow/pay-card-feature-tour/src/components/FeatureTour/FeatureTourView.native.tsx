import React, { useCallback, useEffect, useRef } from "react";
import { Image, type ImageSourcePropType } from "react-native";
import {
  Box,
  Button,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import * as Icons from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import heroImage from "./payTabTour.webp";
import type { FeatureTourViewModel } from "./useFeatureTourViewModel";

type FeatureTourViewProps = FeatureTourViewModel;

export function FeatureTourView({
  isVisible,
  title,
  description,
  rows,
  ctaLabel,
  onShown,
  onDismiss,
}: FeatureTourViewProps) {
  const dismissed = useRef(false);
  const shown = useRef(false);

  useEffect(() => {
    if (isVisible && !shown.current) {
      shown.current = true;
      onShown();
    }
  }, [isVisible, onShown]);

  const handleDismiss = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    onDismiss();
  }, [onDismiss]);

  if (!isVisible) {
    return null;
  }

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isVisible}
      onClose={handleDismiss}
      enableDynamicSizing
      testID="pay-feature-tour-sheet"
    >
      <Box lx={{ padding: "s16", gap: "s24" }}>
        <Image
          source={heroImage as unknown as ImageSourcePropType}
          resizeMode="cover"
          style={{ width: "100%", height: 180, borderRadius: 16 }}
        />
        <Box lx={{ flexDirection: "column", gap: "s8" }}>
          <Text typography="heading3">{title}</Text>
          <Text typography="body2" lx={{ color: "muted" }}>
            {description}
          </Text>
        </Box>
        <Box lx={{ flexDirection: "column", gap: "s8" }}>
          {rows.map((row, index) => {
            const RowIcon = Icons[row.icon];
            return (
              <ListItem
                key={`${row.icon}-${index}`}
                testID={`pay-feature-tour-row-${row.icon}-${index}`}
              >
                <ListItemLeading>{RowIcon ? <RowIcon size={24} /> : null}</ListItemLeading>
                <ListItemContent>
                  <ListItemTitle>{row.title}</ListItemTitle>
                  <ListItemDescription>{row.description}</ListItemDescription>
                </ListItemContent>
              </ListItem>
            );
          })}
        </Box>
        <Button appearance="base" size="lg" onPress={handleDismiss} accessibilityLabel={ctaLabel}>
          {ctaLabel}
        </Button>
      </Box>
    </QueuedBottomSheet>
  );
}
