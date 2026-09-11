import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import { DeveloperToggleRow } from "../../components/DeveloperToggleRow";

interface Q3TourSectionProps {
  readonly hasSeen: boolean;
  readonly isEnabled: boolean;
  readonly onToggleHasSeen: () => void;
  readonly onToggleEnabled: () => void;
}

export const Q3TourSection = ({
  hasSeen,
  isEnabled,
  onToggleHasSeen,
  onToggleEnabled,
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
        description="Toggles releaseTour enabled with variant q3_a."
      />
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
      <Button appearance="accent" size="sm" disabled>
        {t("settings.developer.walletFeaturesDevTool.openDrawer")}
      </Button>
    </div>
  );
};
