import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { useFeature } from "@features/platform-feature-flags";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import React, { memo, useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Alert from "~/renderer/components/Alert";
import Link from "~/renderer/components/Link";
import { useLLDCoinFamily } from "~/renderer/families";

type Props = {
  operation: Operation;
  account: AccountLike;
  parentAccount?: Account;
};

const EditOperationPanel = (props: Props) => {
  const { operation, account, parentAccount } = props;
  const dispatch = useDispatch();
  const { enabled: isEditEvmTxEnabled, params } = useFeature("editEvmTx") ?? {};
  const { enabled: isEditBitcoinTxEnabled, params: bitcoinParams } =
    useFeature("editBitcoinTx") ?? {};
  const mainAccount = getMainAccount(account, parentAccount);
  const bridge = useAccountBridge(mainAccount);
  const family = useLLDCoinFamily(mainAccount.currency.family);

  // Determine if transaction editing is supported and which modal to use
  const editConfig = useMemo(() => {
    const familyEditConfig = family.handlesEditTransaction?.({
      account,
      parentAccount,
      mainAccount,
      operation,
      bridge,
      featureFlags: {
        evm: {
          enabled: isEditEvmTxEnabled ?? false,
          supportedCurrencyIds: params?.supportedCurrencyIds,
        },
        bitcoin: {
          enabled: isEditBitcoinTxEnabled ?? false,
          supportedCurrencyIds: bitcoinParams?.supportedCurrencyIds,
        },
      },
    });

    return familyEditConfig
      ? {
          modalName: familyEditConfig.modalName,
          isSupported: true,
          params: familyEditConfig.params,
        }
      : null;
  }, [
    account,
    parentAccount,
    operation,
    mainAccount,
    bridge,
    family,
    isEditEvmTxEnabled,
    params,
    isEditBitcoinTxEnabled,
    bitcoinParams,
  ]);

  const handleOpenEditModal = useCallback(() => {
    if (!editConfig) {
      return;
    }

    dispatch(closeModal("MODAL_SEND"));
    dispatch(openModal(editConfig.modalName, editConfig.params));
  }, [editConfig, dispatch]);

  if (!editConfig?.isSupported) {
    return null;
  }

  return (
    <div style={{ marginBottom: "15px" }}>
      <Alert type="warning">
        <Trans i18nKey="operation.edit.panel.description" />
        <div>
          <Link
            style={{ textDecoration: "underline", fontSize: "13px" }}
            onClick={handleOpenEditModal}
          >
            <Trans i18nKey="operation.edit.panel.title" />
          </Link>
        </div>
      </Alert>
    </div>
  );
};

export default memo<Props>(EditOperationPanel);
