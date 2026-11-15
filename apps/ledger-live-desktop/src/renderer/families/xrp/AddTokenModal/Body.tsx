import BigNumber from "bignumber.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account, AccountBridge, Operation, TokenAccount } from "@ledgerhq/types-live";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getAssetFromToken } from "@ledgerhq/live-common/families/xrp/bridge/api";
import { getMaxTrustLimitForToken } from "@ledgerhq/live-common/families/xrp/logicPublic";
import type { Transaction } from "@ledgerhq/live-common/families/xrp/types";
import { Track } from "@shared/analytics-react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Stepper from "~/renderer/components/Stepper";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import logger from "~/renderer/logger";
import { getXrpResources } from "../utils";
import StepToken, { StepTokenFooter } from "./steps/StepToken";
import StepSettings, { StepSettingsFooter } from "./steps/StepSettings";
import StepReview, { StepReviewFooter } from "./steps/StepReview";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { ACTION_I18N, AddTokenStep, StepId, StepProps, TokenAction } from "./types";

export type Data = {
  account: Account;
  tokenAccount?: TokenAccount;
  token?: TokenCurrency;
};

type Props = Readonly<{
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (stepId: StepId) => void;
  params: Data;
}>;

const tokenStep: AddTokenStep = {
  id: "token",
  label: <Trans i18nKey="xrp.addToken.steps.token.title" />,
  component: StepToken,
  noScroll: true,
  footer: StepTokenFooter,
};

const settingsStep: AddTokenStep = {
  id: "settings",
  label: <Trans i18nKey="xrp.addToken.steps.settings.title" />,
  component: StepSettings,
  footer: StepSettingsFooter,
};

const reviewStep: AddTokenStep = {
  id: "review",
  label: <Trans i18nKey="xrp.addToken.steps.review.title" />,
  component: StepReview,
  footer: StepReviewFooter,
  onBack: ({ token, transitionTo }) =>
    transitionTo(token?.tokenType === "mpt" ? "token" : "settings"),
};

const connectDeviceStep: AddTokenStep = {
  id: "connectDevice",
  label: <Trans i18nKey="xrp.addToken.steps.connectDevice.title" />,
  component: GenericStepConnectDevice,
  onBack: ({ transitionTo }) => transitionTo("review"),
};

const confirmationStep: AddTokenStep = {
  id: "confirmation",
  label: <Trans i18nKey="xrp.addToken.steps.confirmation.title" />,
  component: StepConfirmation,
  footer: StepConfirmationFooter,
};

export function getSteps(action: TokenAction, token: TokenCurrency | undefined): AddTokenStep[] {
  if (action === "edit") {
    return [settingsStep, reviewStep, connectDeviceStep, confirmationStep];
  }

  const hasSettings = token?.tokenType !== "mpt";
  const settingsStepWithBack: AddTokenStep = {
    ...settingsStep,
    onBack: ({ transitionTo }) => transitionTo("token"),
  };

  return [
    tokenStep,
    ...(hasSettings ? [settingsStepWithBack] : []),
    reviewStep,
    connectDeviceStep,
    confirmationStep,
  ];
}

function toAssetFields(token: TokenCurrency) {
  const asset = getAssetFromToken(token);
  if (!asset || !("assetReference" in asset)) return {};

  return { assetReference: asset.assetReference, assetOwner: asset.assetOwner };
}

function getMaxLimit(token: TokenCurrency | undefined): BigNumber | null {
  return token?.tokenType === "iou" ? getMaxTrustLimitForToken() : null;
}

export function makeChangeTrustTransaction(
  bridge: AccountBridge<Transaction>,
  account: Account,
  tokenAccount: TokenAccount | undefined,
): Transaction {
  const currentLimit = getXrpResources(tokenAccount)?.limit;

  return bridge.updateTransaction(bridge.createTransaction(account), {
    mode: "changeTrust",
    ...(tokenAccount && { ...toAssetFields(tokenAccount.token), amount: currentLimit }),
  });
}

export default function Body({ stepId, onClose, onChangeStepId, params }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const { tokenAccount } = params;
  const action: TokenAction = tokenAccount ? "edit" : "add";

  const [token, setToken] = useState<TokenCurrency | undefined>(
    tokenAccount?.token ?? params.token,
  );
  const [isRippling, setIsRippling] = useState(getXrpResources(tokenAccount)?.isRippling ?? false);
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | undefined>();
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

  const bridge = useAccountBridge<Transaction>(params.account, undefined);
  const {
    transaction,
    updateTransaction,
    account,
    parentAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction<Transaction>(bridge, () => {
    return {
      transaction: makeChangeTrustTransaction(bridge, params.account, tokenAccount),
      account: params.account,
      parentAccount: undefined,
    };
  });

  const applyToken = useCallback(
    (picked: TokenCurrency) => {
      updateTransaction(tx => {
        return bridge.updateTransaction(tx, {
          assetReference: undefined,
          assetOwner: undefined,
          ...toAssetFields(picked),
          amount: getMaxLimit(picked) ?? new BigNumber(0),
        });
      });
    },
    [bridge, updateTransaction],
  );

  const onChangeToken = useCallback(
    (picked: TokenCurrency | undefined | null) => {
      if (!picked) return;
      setToken(picked);
      applyToken(picked);
    },
    [applyToken],
  );

  useEffect(() => {
    if (tokenAccount) return;

    if (params.token) applyToken(params.token);
  }, [tokenAccount, params.token, applyToken]);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    setSigned(false);
    onChangeStepId(action === "edit" ? "settings" : "token");
  }, [action, onChangeStepId]);

  const handleTransactionError = useCallback((error: Error) => {
    if (error?.name !== "UserRefusedOnDevice") {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);

  const handleOperationBroadcasted = useCallback(
    (operation: Operation) => {
      if (!account) return;

      dispatch(
        updateAccountWithUpdater(account.id, storedAccount => {
          return addPendingOperation(storedAccount, operation);
        }),
      );
      setOptimisticOperation(operation);
      setTransactionError(null);
    },
    [account, dispatch],
  );

  const steps = useMemo(() => getSteps(action, token), [action, token]);
  const error = transactionError ?? bridgeError ?? undefined;

  const stepProps: Omit<StepProps, "transitionTo"> = {
    t,
    device,
    account,
    parentAccount,
    onClose,
    optimisticOperation,
    error,
    signed,
    transaction,
    status,
    setSigned,
    bridgePending,
    action,
    token,
    onChangeToken,
    maxLimit: getMaxLimit(token),
    isRippling,
    tokenAccount,
    onChangeRippling: setIsRippling,
    onRetry: handleRetry,
    onUpdateTransaction: updateTransaction,
    onTransactionError: handleTransactionError,
    onOperationBroadcasted: handleOperationBroadcasted,
  };

  return (
    <Stepper
      {...stepProps}
      title={t(`${ACTION_I18N[action]}.title`)}
      stepId={stepId}
      steps={steps}
      errorSteps={transactionError ? [steps.length - 1] : []}
      hideBreadcrumb={!!error}
      onStepChange={(step: AddTokenStep) => onChangeStepId(step.id)}
    >
      {stepId === "confirmation" ? null : <SyncSkipUnderPriority priority={100} />}
      <Track onUnmount event="CloseModalXrpAddToken" />
    </Stepper>
  );
}
