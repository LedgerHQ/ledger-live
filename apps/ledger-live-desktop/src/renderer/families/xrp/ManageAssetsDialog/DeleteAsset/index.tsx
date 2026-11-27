import React from "react";
import { useTranslation } from "react-i18next";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import type { Account } from "@ledgerhq/types-live";
import { InfoState } from "@shared/ui-info-state";
import TranslatedError from "~/renderer/components/TranslatedError";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { SignatureSteps } from "../../components/Signature";
import { StepScreen } from "../../components/StepScreen";
import { useDeleteAssetViewModel } from "./useDeleteAssetViewModel";

type Props = Readonly<{
  account: Account;
  tokenAccount: XrpTokenAccount;
  onBack: () => void;
  onClose: () => void;
}>;

export function DeleteAsset({ account, tokenAccount, onBack, onClose }: Props) {
  const { t } = useTranslation();
  const { ticker } = tokenAccount.token;

  if (tokenAccount.balance.gt(0)) {
    return (
      <StepScreen onClose={onClose}>
        <InfoState
          preset="error"
          size="hug"
          testID="xrp-delete-asset-blocked"
          title={t("xrp.manageAssets.deleteBlocked.title", { ticker })}
          description={t("xrp.manageAssets.deleteBlocked.description", { ticker })}
          primaryCta={{ label: t("xrp.manageAssets.editAsset.gotIt"), onPress: onBack }}
        />
      </StepScreen>
    );
  }

  return <DeleteEmptyAsset account={account} tokenAccount={tokenAccount} onClose={onClose} />;
}

function DeleteEmptyAsset({ account, tokenAccount, onClose }: Omit<Props, "onBack">) {
  const { t } = useTranslation();
  const accountName = useMaybeAccountName(account) ?? account.currency.name;
  const viewModel = useDeleteAssetViewModel(account, tokenAccount, onClose);
  const { signature, error } = viewModel;
  const { ticker } = tokenAccount.token;

  if (signature.phase !== "idle") {
    return (
      <SignatureSteps
        signature={signature}
        successTitle={t("xrp.manageAssets.deleteSuccess.title", { ticker })}
        successDescription={t("xrp.manageAssets.deleteSuccess.description")}
        hideViewDetails
        errorTitle={t("xrp.manageAssets.deleteError.title")}
        onClose={onClose}
      />
    );
  }

  if (viewModel.isFeeErrorShown) {
    return (
      <StepScreen onClose={onClose}>
        <InfoState
          preset="error"
          size="hug"
          testID="xrp-delete-asset-fee-error"
          title={t("xrp.manageAssets.deleteFeeError.title")}
          description={t("xrp.manageAssets.deleteFeeError.description", {
            minimumAmount: viewModel.feeMinimum,
          })}
          primaryCta={{
            label: t("xrp.manageAssets.deleteFeeError.swap"),
            onPress: viewModel.onSwap,
            testID: "xrp-delete-asset-swap",
          }}
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
        title={t("xrp.manageAssets.deleteConfirm.title", { ticker })}
        description={t("xrp.manageAssets.deleteConfirm.description", { accountName })}
        banner={
          error
            ? {
                appearance: "error",
                testID: "xrp-delete-asset-error",
                description: (
                  <>
                    <span className="block">
                      <TranslatedError error={error} field="title" />
                    </span>
                    <TranslatedError error={error} field="description" />
                  </>
                ),
              }
            : undefined
        }
        primaryCta={{
          label: t("common.continue"),
          onPress: viewModel.onContinue,
          disabled: viewModel.isContinueDisabled,
          loading: viewModel.bridgePending,
          testID: "xrp-delete-asset-continue",
        }}
      />
    </StepScreen>
  );
}
