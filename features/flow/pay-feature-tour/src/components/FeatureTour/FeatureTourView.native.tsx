import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, type ImageSourcePropType } from "react-native";
import {
  BottomSheetHeader,
  BottomSheetView,
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
  const onShownRef = useRef(onShown);
  onShownRef.current = onShown;
  const [isOpen, setIsOpen] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      dismissed.current = false;
      setIsOpen(true);
      onShownRef.current();
    }
  }, [isVisible]);

  const handleDismiss = useCallback(() => {
    if (dismissed.current) {
      return;
    }
    dismissed.current = true;
    setIsOpen(false);
    onDismiss();
  }, [onDismiss]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleDismiss}
      enableDynamicSizing
      testID="pay-feature-tour-sheet"
    >
      {isOpen ? (
        <BottomSheetView>
          <BottomSheetHeader density="expanded" />
          <Box lx={{ paddingBottom: "s24", gap: "s16" }}>
            <Image
              source={heroImage as unknown as ImageSourcePropType}
              resizeMode="cover"
              style={{ width: "100%", height: 192, borderRadius: 24 }}
            />
            <Box lx={{ flexDirection: "column", gap: "s4" }}>
              <Box lx={{ flexDirection: "column", gap: "s8" }}>
                <Text typography="heading3SemiBold" lx={{ color: "base" }}>
                  {title}
                </Text>
                <Text typography="body2" lx={{ color: "muted" }}>
                  {description}
                </Text>
              </Box>
              <Box lx={{ flexDirection: "column" }}>
                {rows.map((row, index) => {
                  const RowIcon = Icons[row.icon];
                  return (
                    <ListItem
                      key={`${row.icon}-${index}`}
                      testID={`pay-feature-tour-row-${row.icon}-${index}`}
                    >
                      <ListItemLeading>
                        {RowIcon ? <RowIcon size={24} /> : null}
                        <ListItemContent>
                          <ListItemTitle>{row.title}</ListItemTitle>
                          <ListItemDescription>{row.description}</ListItemDescription>
                        </ListItemContent>
                      </ListItemLeading>
                    </ListItem>
                  );
                })}
              </Box>
            </Box>
            <Button
              appearance="base"
              size="lg"
              onPress={handleDismiss}
              accessibilityLabel={ctaLabel}
            >
              {ctaLabel}
            </Button>
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
