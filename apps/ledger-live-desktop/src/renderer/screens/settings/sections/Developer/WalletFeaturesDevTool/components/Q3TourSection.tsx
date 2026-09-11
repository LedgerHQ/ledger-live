import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Divider,
  SegmentedControl,
  SegmentedControlButton,
} from "@ledgerhq/lumen-ui-react";
import type { Q3TourVariant } from "LLD/features/Q3Tour/Drawer/const";
import { DeveloperToggleRow } from "../../components/DeveloperToggleRow";

interface Q3TourSectionProps {
  readonly hasSeen: boolean;
  readonly isEnabled: boolean;
  readonly selectedVariant: Q3TourVariant;
  readonly onToggleHasSeen: () => void;
  readonly onToggleEnabled: () => void;
  readonly onVariantChange: (variant: string) => void;
  readonly onOpenDrawer: () => void;
}

export const Q3TourSection = ({
  hasSeen,
  isEnabled,
  selectedVariant,
  onToggleHasSeen,
  onToggleEnabled,
  onVariantChange,
  onOpenDrawer,
}: Q3TourSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <span className="body-2-semi-bold text-muted">Q3 Tour</span>
      <Divider />
      <DeveloperToggleRow
        name="wallet-feature-q3-tour-enabled"
        label="Q3 release tour"
        selected={isEnabled}
        onChange={onToggleEnabled}
        description="Toggles releaseTour enabled. Variant is chosen below."
      />
      <div className="flex flex-col gap-3 py-2">
        <span className="body-3-semi-bold text-muted">Variant</span>
        <SegmentedControl
          selectedValue={selectedVariant}
          onSelectedChange={onVariantChange}
          tabLayout="fit"
          aria-label="Q3 release tour variant"
        >
          <SegmentedControlButton value="q3_a">q3_a</SegmentedControlButton>
          <SegmentedControlButton value="q3_b">q3_b</SegmentedControlButton>
          <SegmentedControlButton value="q3_b2">q3_b2</SegmentedControlButton>
        </SegmentedControl>
      </div>
      <DeveloperToggleRow
        name="wallet-feature-q3-tour-has-seen"
        label="Has Seen Q3 Tour"
        selected={hasSeen}
        onChange={onToggleHasSeen}
        description={
          hasSeen
            ? "User has already seen the tour. Toggle to reset."
            : "User has not seen the tour yet."
        }
      />
      <Button appearance="accent" size="sm" onClick={onOpenDrawer} disabled={hasSeen || !isEnabled}>
        {t("settings.developer.walletFeaturesDevTool.openDrawer")}
      </Button>
    </div>
  );
};
