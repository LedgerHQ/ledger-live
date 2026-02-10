import React from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useOpenAssetFlow } from "LLD/features/ModularDialog/hooks/useOpenAssetFlow";
import { ModularDrawerLocation } from "LLD/features/ModularDrawer";

export const AddAccount = () => {
  const { t } = useTranslation();
  const { openAssetFlow } = useOpenAssetFlow(
    { location: ModularDrawerLocation.ADD_ACCOUNT },
    "portfolio_add_account",
  );

  const onAction = () => {
    openAssetFlow();
  };

  return (
    <div className="flex flex-col items-center px-2">
      <Button
        appearance="gray"
        size="md"
        isFull
        onClick={onAction}
        data-testid={`portfolio-add-account-button`}
      >
        {t("portfolio.addAccountCta")}
      </Button>
    </div>
  );
};
