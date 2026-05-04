import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Divider } from "@ledgerhq/lumen-ui-react";
import { DeveloperToggleRow } from "../components/DeveloperToggleRow";

interface ProductTourSectionProps {
  readonly productTourCompleted: boolean;
  readonly onToggleProductTourCompleted: () => void;
  readonly onOpenProductTour: () => void;
}

export const ProductTourSection = ({
  productTourCompleted,
  onToggleProductTourCompleted,
  onOpenProductTour,
}: ProductTourSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <span className="body-2-semi-bold text-muted">
        {t("settings.developer.featuresAndFlowsDevTool.productTour.title")}
      </span>
      <Divider />
      <DeveloperToggleRow
        name="wallet-feature-product-tour"
        label={t("settings.developer.featuresAndFlowsDevTool.productTour.label")}
        selected={productTourCompleted}
        onChange={onToggleProductTourCompleted}
        description={
          productTourCompleted
            ? t("settings.developer.featuresAndFlowsDevTool.productTour.completed")
            : t("settings.developer.featuresAndFlowsDevTool.productTour.notCompleted")
        }
      />
      <Button appearance="accent" size="sm" onClick={onOpenProductTour}>
        {t("settings.developer.featuresAndFlowsDevTool.productTour.open")}
      </Button>
    </div>
  );
};
