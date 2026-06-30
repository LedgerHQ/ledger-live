import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import { DeveloperToggleRow } from "../../components/DeveloperToggleRow";

interface Q2TourSectionProps {
  readonly hasSeen: boolean;
  readonly onToggleHasSeen: () => void;
  readonly onOpenDrawer: () => void;
}

export const Q2TourSection = ({ hasSeen, onToggleHasSeen, onOpenDrawer }: Q2TourSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <span className="body-2-semi-bold text-muted">Q2 Tour</span>
      <Divider />
      <DeveloperToggleRow
        name="wallet-feature-q2-tour-has-seen"
        label="Has Seen Q2 Tour"
        selected={hasSeen}
        onChange={onToggleHasSeen}
        description={
          hasSeen
            ? "User has already seen the tour. Toggle to reset."
            : "User has not seen the tour yet."
        }
      />
      <Button appearance="accent" size="sm" onClick={onOpenDrawer} disabled={hasSeen}>
        {t("settings.developer.walletFeaturesDevTool.openDrawer")}
      </Button>
    </div>
  );
};
