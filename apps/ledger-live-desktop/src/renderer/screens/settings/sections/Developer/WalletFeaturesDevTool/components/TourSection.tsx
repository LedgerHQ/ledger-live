import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import { ToggleRow } from "./ToggleRow";

interface TourSectionProps {
  readonly hasSeenTour: boolean;
  readonly onToggleHasSeenTour: () => void;
  readonly onOpenDrawer: () => void;
}

export const TourSection = ({
  hasSeenTour,
  onToggleHasSeenTour,
  onOpenDrawer,
}: TourSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <span className="body-2-semi-bold text-muted">
        {t("settings.developer.walletFeaturesDevTool.tourState")}
      </span>
      <Divider />
      <ToggleRow
        name="wallet-feature-has-seen-tour"
        label="Has Seen Wallet V4 Tour"
        selected={hasSeenTour}
        onChange={onToggleHasSeenTour}
        description={
          hasSeenTour
            ? "User has already seen the tour. Toggle to reset."
            : "User has not seen the tour yet."
        }
      />
      <Button appearance="accent" size="sm" onClick={onOpenDrawer}>
        {t("settings.developer.walletFeaturesDevTool.openDrawer")}
      </Button>
    </div>
  );
};
