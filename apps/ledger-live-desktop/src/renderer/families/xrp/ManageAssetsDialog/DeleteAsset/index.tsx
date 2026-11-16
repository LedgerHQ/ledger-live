import React from "react";
import { Trans, useTranslation } from "react-i18next";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { InfoState } from "@shared/ui-info-state";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { SignatureSteps } from "../../components/Signature";
import { StepScreen } from "../../components/StepScreen";
import { useDeleteAssetViewModel } from "./useDeleteAssetViewModel";

type Props = Readonly<{
  account: Account;
  tokenAccount: TokenAccount;
  onBackToList: () => void;
  onClose: () => void;
}>;

export function DeleteAsset({ account, tokenAccount, onBackToList, onClose }: Props) {
  const { t } = useTranslation();
  const accountName = useMaybeAccountName(account) ?? account.currency.name;
  const viewModel = useDeleteAssetViewModel(account, tokenAccount);
  const { token } = tokenAccount;
  const gotIt = t("xrp.manageAssets.deleteAsset.gotIt");

  if (viewModel.signature.phase !== "idle") {
    return (
      <SignatureSteps
        signature={viewModel.signature}
        successTitle={t("xrp.removeToken.steps.confirmation.success.title", { token: token.name })}
        successDescription={
          <Trans
            i18nKey="xrp.removeToken.steps.confirmation.success.text"
            values={{ token: token.name }}
            components={[<span key="token" className="text-base" />]}
          />
        }
        onClose={onClose}
      />
    );
  }

  if (viewModel.hasBalanceLeft) {
    return (
      <StepScreen onClose={onClose}>
        <InfoState
          preset="error"
          size="hug"
          testID="xrp-delete-asset-balance-left"
          title={t("xrp.manageAssets.deleteAsset.balanceLeft.title", { token: token.name })}
          description={t("xrp.manageAssets.deleteAsset.balanceLeft.description", {
            token: token.name,
          })}
          primaryCta={{ label: gotIt, onPress: onBackToList }}
        />
      </StepScreen>
    );
  }

  return (
    <StepScreen onClose={onClose}>
      <InfoState
        preset="info"
        size="hug"
        testID="xrp-delete-asset-confirm"
        title={t("xrp.manageAssets.deleteAsset.confirm.title", { token: token.name })}
        description={
          <>
            {t("xrp.manageAssets.deleteAsset.confirm.description", { accountName })}
            {token.tokenType === "iou" ? (
              <span className="mt-8 block">
                {t("xrp.removeToken.steps.connectDevice.limitZero")}
              </span>
            ) : null}
          </>
        }
        primaryCta={{
          label: gotIt,
          onPress: viewModel.signature.onStart,
          loading: viewModel.bridgePending,
          disabled: viewModel.bridgePending,
          testID: "xrp-delete-asset-confirm-cta",
        }}
      />
    </StepScreen>
  );
}
