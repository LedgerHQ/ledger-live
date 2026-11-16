import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { SignatureSteps } from "../../components/Signature";
import { StepScreen } from "../../components/StepScreen";
import { LimitScreen, TrustSettingsRows } from "../../components/TrustSettings";
import { useEditAssetViewModel } from "./useEditAssetViewModel";

type Props = Readonly<{
  account: Account;
  tokenAccount: TokenAccount;
  onBackToList: () => void;
  onClose: () => void;
}>;

export function EditAsset({ account, tokenAccount, onBackToList, onClose }: Props) {
  const { t } = useTranslation();
  const viewModel = useEditAssetViewModel(account, tokenAccount);

  if (viewModel.signature.phase !== "idle") {
    return (
      <SignatureSteps
        signature={viewModel.signature}
        successTitle={t("xrp.manageAssets.editAsset.success", { token: tokenAccount.token.name })}
        onClose={onClose}
      />
    );
  }

  if (viewModel.trustSettings.isLimitStep) {
    return (
      <LimitScreen
        settings={viewModel.trustSettings}
        isPending={viewModel.bridgePending}
        onClose={onClose}
      />
    );
  }

  return (
    <StepScreen
      title={t("xrp.manageAssets.editAsset.title")}
      onBack={onBackToList}
      onClose={onClose}
    >
      <TrustSettingsRows settings={viewModel.trustSettings} />
      <Button
        appearance="base"
        size="lg"
        isFull
        disabled={viewModel.isContinueDisabled}
        onClick={viewModel.signature.onStart}
        data-testid="xrp-edit-asset-continue"
      >
        {t("common.continue")}
      </Button>
    </StepScreen>
  );
}
