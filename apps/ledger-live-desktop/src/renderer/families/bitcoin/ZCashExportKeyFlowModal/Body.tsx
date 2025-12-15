import React, { useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { StepId, St } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import { closeModal } from "~/renderer/actions/modals";
import StepIntro, { StepExportFooter } from "./steps/StepIntro";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { Account } from "@ledgerhq/types-live";
import StepExport from "./steps/StepExport";

export type Data = {
  account: BitcoinAccount;
};

type OwnProps = {
  stepId: StepId;
  isUfvkExported: boolean;
  ufvkExportError: Error | undefined | null;
  onChangeStepId: (stepId: StepId) => void;
  onChangeUfvkExported: (isUfvkExported: boolean, error: Error | undefined | null) => void;
  onClose: () => void;
  params: Data;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
};

type Props = OwnProps & StateProps;

const steps: Array<St> = [
  {
    id: "intro",
    label: <Trans i18nKey="zcash.shielded.flows.export.breadcrumbs.0" />,
    component: StepIntro,
    noScroll: true,
    footer: StepExportFooter,
  },
  {
    id: "device",
    label: <Trans i18nKey="zcash.shielded.flows.export.breadcrumbs.1" />,
    component: StepConnectDevice,
  },
  {
    id: "export",
    label: <Trans i18nKey="zcash.shielded.flows.export.breadcrumbs.2" />,
    component: StepExport,
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="zcash.shielded.flows.export.breadcrumbs.3" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
  accounts: accountsSelector,
});

const mapDispatchToProps = {
  closeModal,
};

const Body = ({
  t,
  stepId,
  device,
  isUfvkExported,
  ufvkExportError,
  onClose,
  onChangeStepId,
  onChangeUfvkExported,
  params,
}: Props) => {
  const dispatch = useDispatch();

  const { account } = params;

  const handleStepChange = useCallback((s: St) => onChangeStepId(s.id), [onChangeStepId]);

  const handleRetry = useCallback(() => {
    onChangeUfvkExported(false, null);
    onChangeStepId("export");
  }, [onChangeStepId]);

  const handleExportError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    onChangeUfvkExported(false, error);
  }, []);

  const handleUfvkExported = useCallback(
    (ufvk: string) => {
      if (!account) return;
      dispatch(
        updateAccountWithUpdater(account.id, account => {
          // return addPendingOperation(account, optimisticOperation),
          // TODO: Add UFVK to the account
          console.log(`add ufvk to account: ${ufvk}`);
          return account;
        }),
      );
      onChangeUfvkExported(true, null);
    },
    [account, dispatch],
  );

  // const error = ufvkExportError || bridgeError;
  const error = ufvkExportError;
  const errorSteps = [];

  if (ufvkExportError) {
    errorSteps.push(2);
  } /* else if (bridgeError) {
    errorSteps.push(0);
  } */

  const stepperProps = {
    title: t("zcash.shielded.flows.export.title"),
    device,
    account,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: false,
    error,
    isUfvkExported,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onUfvkExported: handleUfvkExported,
    onClose,
    openModal,
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalShielded" />
    </Stepper>
  );
};

const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;
