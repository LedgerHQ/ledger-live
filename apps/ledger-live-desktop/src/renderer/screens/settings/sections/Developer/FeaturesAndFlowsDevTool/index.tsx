import React, { useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { productTourCompletedSelector } from "~/renderer/reducers/settings";
import { setProductTourCompleted } from "~/renderer/actions/settings";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { ProductTourSection } from "./ProductTourSection";
import { RecoverSubscriptionStateSection } from "./RecoverSubscriptionStateSection";
import { useProductTourDialogViewModel, ProductTourDialog } from "LLD/features/ProductTour/Drawer";

const FeaturesAndFlowsDevTool = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const [contentExpanded, setContentExpanded] = useState(false);

  const {
    isOpen,
    openDialog: openProductTourDialog,
    onClose,
    onDismiss,
    onComplete,
    onPrimaryAction,
    onSlideChange,
  } = useProductTourDialogViewModel();

  const toggleContentVisibility = () => {
    setContentExpanded(prev => !prev);
  };

  const handleToggleProductTourCompleted = () => {
    dispatch(setProductTourCompleted(!productTourCompleted));
  };

  return (
    <>
      <Row
        title={t("settings.developer.featuresAndFlowsDevTool.title")}
        descContainerStyle={{ maxWidth: undefined }}
        contentContainerStyle={{ marginRight: 0 }}
        childrenContainerStyle={{ alignSelf: "flex-start" }}
        desc={
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-muted">
              {t("settings.developer.featuresAndFlowsDevTool.description")}
            </p>

            {contentExpanded ? (
              <div className="mt-4 flex flex-col gap-12">
                <ProductTourSection
                  productTourCompleted={productTourCompleted}
                  onToggleProductTourCompleted={handleToggleProductTourCompleted}
                  onOpenProductTour={openProductTourDialog}
                />
                <RecoverSubscriptionStateSection />
              </div>
            ) : null}
          </div>
        }
      >
        <Button appearance="accent" size="sm" onClick={toggleContentVisibility}>
          {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
        </Button>
      </Row>
      <ProductTourDialog
        isOpen={isOpen}
        onClose={onClose}
        onDismiss={onDismiss}
        onComplete={onComplete}
        onPrimaryAction={onPrimaryAction}
        onSlideChange={onSlideChange}
      />
    </>
  );
};

export default FeaturesAndFlowsDevTool;
