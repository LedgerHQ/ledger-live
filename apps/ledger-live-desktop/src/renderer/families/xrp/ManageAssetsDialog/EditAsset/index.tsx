import React from "react";
import { useTranslation } from "react-i18next";
import { Banner, Button } from "@ledgerhq/lumen-ui-react";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { Account } from "@ledgerhq/types-live";
import TranslatedError from "~/renderer/components/TranslatedError";
import { SignatureSteps } from "../../components/Signature";
import { StepScreen } from "../../components/StepScreen";
import { BalanceLimitScreen } from "../../components/TrustSettings/BalanceLimitScreen";
import { TrustSettingsRows } from "../../components/TrustSettings/TrustSettingsRows";
import { useEditAssetViewModel } from "./useEditAssetViewModel";

type Props = Readonly<{
  account: Account;
  tokenAccount: XrpTokenAccount;
  onBack: () => void;
  onClose: () => void;
}>;

export function EditAsset({ account, tokenAccount, onBack, onClose }: Props) {
  const { t } = useTranslation();
  const viewModel = useEditAssetViewModel(account, tokenAccount);
  const { signature, trustSettings, error } = viewModel;

  if (signature.phase !== "idle") {
    return (
      <SignatureSteps
        signature={signature}
        successTitle={t("xrp.manageAssets.editAsset.success")}
        onClose={onClose}
      />
    );
  }

  if (trustSettings.isLimitStep) {
    return <BalanceLimitScreen settings={trustSettings} onClose={onClose} />;
  }

  return (
    <StepScreen title={t("xrp.manageAssets.editAsset.title")} onBack={onBack} onClose={onClose}>
      <TrustSettingsRows settings={trustSettings} />
      {viewModel.isCurrentLimitZero ? (
        <Banner appearance="warning" description={t("xrp.tokenSettings.currentLimitZero")} />
      ) : null}
      {error ? (
        <Banner
          appearance="error"
          description={<TranslatedError error={error} field="title" />}
          data-testid="xrp-edit-asset-error"
        />
      ) : null}
      <Button
        appearance="base"
        size="lg"
        isFull
        disabled={viewModel.isContinueDisabled}
        onClick={signature.onStart}
        data-testid="xrp-edit-asset-continue"
      >
        {t("common.continue")}
      </Button>
    </StepScreen>
  );
}
