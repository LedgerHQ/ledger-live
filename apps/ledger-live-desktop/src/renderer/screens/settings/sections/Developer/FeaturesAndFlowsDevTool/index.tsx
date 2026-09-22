import React, { useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { productTourCompletedSelector } from "~/renderer/reducers/settings";
import { setProductTourCompleted } from "~/renderer/actions/settings";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { ProductTourSection } from "./ProductTourSection";
import { Q2TourSection } from "./Q2TourSection";
import { Q3TourSection } from "./Q3TourSection";
import { RecoverSubscriptionStateSection } from "./RecoverSubscriptionStateSection";
import { useReleaseToursDevToolViewModel } from "./useReleaseToursDevToolViewModel";
import { useProductTourDialogViewModel, ProductTourDialog } from "LLD/features/ProductTour/Drawer";
import { Q2TourDialog, useQ2TourDrawerViewModel } from "LLD/features/Q2Tour";
import { Q3TourDialog, useQ3TourDrawerViewModel } from "LLD/features/Q3Tour";

const FeaturesAndFlowsDevTool = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const productTourCompleted = useSelector(productTourCompletedSelector);
  const [contentExpanded, setContentExpanded] = useState(false);
  const {
    hasSeenQ2Tour,
    isQ2TourEnabled,
    hasSeenQ3Tour,
    isQ3TourEnabled,
    selectedQ3TourVariant,
    handleToggleQ2TourHasSeen,
    handleToggleQ2TourEnabled,
    handleToggleQ3TourHasSeen,
    handleToggleQ3TourEnabled,
    handleQ3TourVariantChange,
  } = useReleaseToursDevToolViewModel();

  const {
    isOpen,
    openDialog: openProductTourDialog,
    onClose,
    onDismiss,
    onComplete,
    onPrimaryAction,
    onSlideChange,
  } = useProductTourDialogViewModel();
  const {
    isDialogOpen: isQ2TourOpen,
    handleOpenDialog: handleOpenQ2Tour,
    closeDrawer: closeQ2Tour,
    dismissDrawer: dismissQ2Tour,
    completeDrawer: completeQ2Tour,
    onSlideChange: onQ2TourSlideChange,
    onContinueClick: onQ2TourContinueClick,
  } = useQ2TourDrawerViewModel();
  const {
    tour: q3Tour,
    isDialogOpen: isQ3TourOpen,
    handleOpenDialog: handleOpenQ3Tour,
    closeDrawer: closeQ3Tour,
    dismissDrawer: dismissQ3Tour,
    completeDrawer: completeQ3Tour,
    onSlideChange: onQ3TourSlideChange,
    onContinueClick: onQ3TourContinueClick,
  } = useQ3TourDrawerViewModel();

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
                <Q2TourSection
                  hasSeen={hasSeenQ2Tour}
                  isEnabled={isQ2TourEnabled}
                  onToggleHasSeen={handleToggleQ2TourHasSeen}
                  onToggleEnabled={handleToggleQ2TourEnabled}
                  onOpenDrawer={handleOpenQ2Tour}
                />
                <Q3TourSection
                  hasSeen={hasSeenQ3Tour}
                  isEnabled={isQ3TourEnabled}
                  selectedVariant={selectedQ3TourVariant}
                  onToggleHasSeen={handleToggleQ3TourHasSeen}
                  onToggleEnabled={handleToggleQ3TourEnabled}
                  onVariantChange={handleQ3TourVariantChange}
                  onOpenDrawer={handleOpenQ3Tour}
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
      <Q2TourDialog
        isOpen={isQ2TourOpen}
        onHeaderClose={closeQ2Tour}
        onDismiss={dismissQ2Tour}
        onContinueClick={onQ2TourContinueClick}
        onComplete={completeQ2Tour}
        onSlideChange={onQ2TourSlideChange}
      />
      <Q3TourDialog
        tour={q3Tour}
        isOpen={isQ3TourOpen}
        onHeaderClose={closeQ3Tour}
        onDismiss={dismissQ3Tour}
        onContinueClick={onQ3TourContinueClick}
        onComplete={completeQ3Tour}
        onSlideChange={onQ3TourSlideChange}
      />
    </>
  );
};

export default FeaturesAndFlowsDevTool;
