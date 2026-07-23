import React, { useCallback, useEffect, useRef } from "react";
import { Image } from "react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { BottomSheet, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Chart2, CreditCard, Globe } from "@ledgerhq/lumen-ui-rnative/symbols";
import heroImage from "./payTabTour.webp";
import type { FeatureTourViewModel } from "./useFeatureTourViewModel";

type FeatureTourViewProps = FeatureTourViewModel;

const ROW_ICONS = {
  global: Globe,
  volatility: Chart2,
  card: CreditCard,
} as const;

export function FeatureTourView({
  isVisible,
  title,
  description,
  rows,
  ctaLabel,
  onShown,
  onDismiss,
}: FeatureTourViewProps) {
  const ref = useRef<BottomSheetModal>(null);
  const dismissed = useRef(false);

  useEffect(() => {
    if (isVisible) {
      ref.current?.present?.();
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
    <BottomSheet ref={ref} enableDynamicSizing onDismiss={handleDismiss}>
      <Box lx={{ padding: "s16", gap: "s24" }}>
        <Image
          source={heroImage as never}
          resizeMode="cover"
          style={{ width: "100%", height: 180, borderRadius: 16 }}
        />
        <Box lx={{ flexDirection: "column", gap: "s8" }}>
          <Text typography="heading3">{title}</Text>
          <Text typography="body2" lx={{ color: "muted" }}>
            {description}
          </Text>
        </Box>
        <Box lx={{ flexDirection: "column", gap: "s24" }}>
          {rows.map(row => {
            const RowIcon = ROW_ICONS[row.key as keyof typeof ROW_ICONS];
            return (
              <Box key={row.key} lx={{ flexDirection: "row", gap: "s16", alignItems: "center" }}>
                {RowIcon ? <RowIcon size={24} /> : null}
                <Box lx={{ flex: 1, flexDirection: "column", gap: "s2" }}>
                  <Text typography="body2SemiBold">{row.title}</Text>
                  <Text typography="body3" lx={{ color: "muted" }}>
                    {row.description}
                  </Text>
                </Box>
              </Box>
            );
          })}
        </Box>
        <Button
          appearance="base"
          size="lg"
          onPress={() => {
            handleDismiss();
            ref.current?.dismiss?.();
          }}
          accessibilityLabel={ctaLabel}
        >
          {ctaLabel}
        </Button>
      </Box>
    </BottomSheet>
  );
}
