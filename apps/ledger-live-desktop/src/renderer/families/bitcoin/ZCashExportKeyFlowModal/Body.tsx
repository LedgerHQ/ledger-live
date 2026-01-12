import React, { useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { StepId, StepperProps } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import { closeModal } from "~/renderer/actions/modals";
import StepIntro, { StepExportFooter } from "./steps/StepIntro";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import StepExport from "./steps/StepExport";

export type Data = {
  account: BitcoinAccount;
};

type OwnProps = {
  stepId: StepId;
  isUfvkExported: boolean;
  ufvkExportError: Error | undefined | null;
  onChangeStepId: (stepId: StepId) => void;
  onUfvkExported: (isUfvkExported: boolean, error?: Error | null) => void;
  onClose: () => void;
  params: Data;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  closeModal: (modalId: string) => void;
};

type Props = OwnProps & StateProps;

const steps: Array<StepperProps> = [
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
});

const mapDispatchToProps = {
  closeModal,
};

const Body = ({
  stepId,
  isUfvkExported,
  ufvkExportError,
  onChangeStepId,
  onUfvkExported,
  closeModal,
  params,
  t,
  device,
}: Props) => {
  const { account } = params;

  const handleStepChange = useCallback((s: StepperProps) => onChangeStepId(s.id), [onChangeStepId]);

  const handleCloseModal = useCallback(() => {
    closeModal("MODAL_ZCASH_EXPORT_KEY");
  }, [closeModal]);

  const handleRetry = useCallback(() => {
    onUfvkExported(false, null);
    onChangeStepId("export");
  }, [onUfvkExported, onChangeStepId]);

  const handleUfvkExportError = useCallback(
    (error: Error) => {
      if (!(error instanceof UserRefusedOnDevice)) {
        logger.critical(error);
      }

      onUfvkExported(false, error);
      onChangeStepId("confirmation");
    },
    [onUfvkExported, onChangeStepId],
  );

  const handleUfvkExported = useCallback(
    (ufvk: string) => {
      if (!account) return;
      // TODO: Add UFVK to the account
      console.log(`add ufvk to account: ${ufvk}`);
      // dispatch(updateAccount({ ...account, privateInfo }));
      // dispatch(
      //   updateAccountWithUpdater(account.id, account => {
      //     return account;
      //   }),
      // );
      onUfvkExported(true);
    },
    [account, onUfvkExported],
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
    onClose: handleCloseModal,
    onStepChange: handleStepChange,
    onUfvkExported: handleUfvkExported,
    onUfvkExportError: handleUfvkExportError,
    closeModal: handleCloseModal,
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
