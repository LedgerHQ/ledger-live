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
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { FEATURE_INTRO_PAGE, PayTrackPage } from "@features/platform-pay-analytics";
import heroImage from "./payTabTour.webp";
import { FEATURE_TOUR_FLOW, type FeatureTourViewModel } from "./useFeatureTourViewModel";

type FeatureTourViewProps = FeatureTourViewModel;

export function FeatureTourView({
  isVisible,
  title,
  description,
  rows,
  ctaLabel,
  onClose,
  onContinue,
}: FeatureTourViewProps) {
  const dismissed = useRef(false);
  const [isOpen, setIsOpen] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      dismissed.current = false;
      setIsOpen(true);
    }
  }, [isVisible]);

  const handleClose = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setIsOpen(false);
    onClose();
  }, [onClose]);

  const handleContinue = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    setIsOpen(false);
    onContinue();
  }, [onContinue]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={handleClose}
      enableDynamicSizing
      testID="pay-feature-tour-sheet"
    >
      {isOpen ? (
        <FeatureTourContent>
          <PayTrackPage
            page={FEATURE_INTRO_PAGE}
            name={FEATURE_TOUR_FLOW}
            flow={FEATURE_TOUR_FLOW}
          />
          <BottomSheetHeader density="compact" />
          <Box lx={{ gap: "s16" }}>
            <Image
              source={heroImage as unknown as ImageSourcePropType}
              resizeMode="cover"
              style={{ width: "100%", height: 192, borderRadius: 24 }}
            />
            <Box lx={{ flexDirection: "column", gap: "s4", paddingBottom: "s40" }}>
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
              isFull
              onPress={handleContinue}
              accessibilityLabel={ctaLabel}
            >
              {ctaLabel}
            </Button>
          </Box>
        </FeatureTourContent>
      ) : null}
    </QueuedBottomSheet>
  );
}

function FeatureTourContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>{children}</BottomSheetView>;
}
