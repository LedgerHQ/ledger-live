import React, { useCallback, useState } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type {
  ModularDrawerConfiguration,
  EnhancedModularDrawerConfiguration,
} from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import { createModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/utils";

import { DialogHeader } from "@ledgerhq/ldls-ui-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { setDialog } from "~/renderer/dialogs/Provider";
import ModularDrawerFlowManager from "../ModularDrawerFlowManager";
import { useSelector } from "react-redux";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { modularDrawerFlowSelector } from "~/renderer/reducers/modularDrawer";
import { MODULAR_DRAWER_STEP, ModularDrawerStep } from "../types";

type Result = {
  account: AccountLike;
  parentAccount?: Account;
};

type DrawerParams = {
  currencies?: string[];
  drawerConfiguration?: ModularDrawerConfiguration | EnhancedModularDrawerConfiguration;
  useCase?: string;
  areCurrenciesFiltered?: boolean;
  onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  onCancel?: () => void;
};

function openAssetAndAccountDialog(params: DrawerParams): void {
  const { currencies, drawerConfiguration, useCase, areCurrenciesFiltered, onSuccess, onCancel } =
    params;

  const modularDrawerConfiguration = createModularDrawerConfiguration(drawerConfiguration);

  const handleSuccess = (result: Result): void => {
    setDialog();
    onSuccess?.(result.account, result.parentAccount);
  };

  const handleCancel = (): void => {
    onCancel?.();
    setDialog();
  };

  return setDialog(
    ModularDialogFlow,
    {
      currencies: currencies ?? [],
      onAccountSelected: (account, parentAccount) => {
        handleSuccess({ account, parentAccount });
      },
      drawerConfiguration: modularDrawerConfiguration,
      useCase,
      areCurrenciesFiltered,
    },
    {
      onClose: handleCancel,
      contentProps: {
        style: {
          padding: 0,
          width: "720px",
          maxWidth: "calc(100vw - 32px)",
        },
      },
    },
  );
}

function openAssetAndAccountDrawerPromise(
  drawerParams: Omit<DrawerParams, "onSuccess" | "onCancel">,
) {
  return new Promise<Result>((resolve, reject) =>
    openAssetAndAccountDrawer({
      ...drawerParams,
      onSuccess: (account, parentAccount) => resolve({ account, parentAccount }),
      onCancel: () => reject(new Error("Canceled by user")),
    }),
  );
}

type DialogFlowProps = React.ComponentProps<typeof ModularDrawerFlowManager> & {
  onClose: () => void;
};

const stepTitleTranslationKey: Record<ModularDrawerStep, string> = {
  [MODULAR_DRAWER_STEP.ASSET_SELECTION]: "modularAssetDrawer.selectAsset",
  [MODULAR_DRAWER_STEP.NETWORK_SELECTION]: "modularAssetDrawer.selectNetwork",
  [MODULAR_DRAWER_STEP.ACCOUNT_SELECTION]: "modularAssetDrawer.selectAccount",
};

const ModularDialogFlow = ({ onClose, ...flowProps }: DialogFlowProps) => {
  const { t } = useTranslation();
  const flow = useSelector(modularDrawerFlowSelector);
  const [currentStep, setCurrentStep] = useState<ModularDrawerStep>(
    MODULAR_DRAWER_STEP.ASSET_SELECTION,
  );

  const handleClose = useCallback(() => {
    track("button_clicked", {
      button: "Close",
      flow,
      page: currentRouteNameRef.current,
    });
    onClose();
  }, [flow, onClose]);

  const handleStepChange = useCallback((step: ModularDrawerStep) => {
    setCurrentStep(step);
  }, []);

  return (
    <DialogContentContainer>
      <DialogHeader
        appearance="compact"
        title={t(stepTitleTranslationKey[currentStep])}
        onClose={handleClose}
      />
      <FlowArea>
        <ModularDrawerFlowManager {...flowProps} hideTitle onStepChange={handleStepChange} />
      </FlowArea>
    </DialogContentContainer>
  );
};

const DialogContentContainer = styled.div`
  width: min(720px, calc(100vw - 32px));
  display: flex;
  flex-direction: column;
  row-gap: 16px;
`;

const FlowArea = styled.div`
  position: relative;
  padding: 48px 8px 16px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
`;

export { openAssetAndAccountDialog };
