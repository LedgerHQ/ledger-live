import React, { useCallback } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { StepId, StepperProps, StepProps } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import { closeModal } from "~/renderer/actions/modals";
import StepBirthday from "./steps/StepBirthday";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { BitcoinAccount } from "@ledgerhq/live-common/families/bitcoin/types";
import { ContinueFooter } from "./shared/ContinueFooter";
import StepUfvk from "./steps/StepUfvk";
import StepDevice, { StepDeviceFooter } from "./steps/StepDevice";

export type Data = {
  account: BitcoinAccount;
};

type OwnProps = {
  stepId: StepId;
  params: Data;
  onClose: () => void;
  ufvk: string;
  ufvkExportError: Error | undefined | null;
  onStepIdChanged: (stepId: StepId) => void;
  onUfvkChanged: (ufvk: string, error?: Error | null) => void;
  onRetry: () => void;
  birthday: string;
  invalidBirthday: boolean;
  syncFromZero: boolean;
  handleBirthdayChange: (value: string) => void;
  handleSyncFromZero: () => void;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  closeModal: (modalId: string) => void;
};

type Props = OwnProps & StateProps;

const steps: Array<StepperProps> = [
  {
    id: "birthday",
    label: <Trans i18nKey="zcash.shielded.flows.export.breadcrumbs.0" />,
    component: StepBirthday,
    noScroll: true,
    footer: ContinueFooter,
  },
  {
    id: "ufvk",
    label: <Trans i18nKey="zcash.shielded.flows.export.breadcrumbs.1" />,
    component: StepUfvk,
    noScroll: true,
    footer: ContinueFooter,
    onBack: ({ transitionTo }: StepProps) => transitionTo("birthday"),
  },
  {
    id: "device",
    label: <Trans i18nKey="zcash.shielded.flows.export.breadcrumbs.2" />,
    component: StepDevice,
    noScroll: true,
    footer: StepDeviceFooter,
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
  t,
  params,
  device,
  stepId,
  closeModal,
  ufvk,
  ufvkExportError,
  onStepIdChanged,
  onUfvkChanged,
  onRetry,
  birthday,
  invalidBirthday,
  syncFromZero,
  handleBirthdayChange,
  handleSyncFromZero,
}: Props) => {
  const { account } = params;

  const handleStepChange = useCallback(
    (s: StepperProps) => onStepIdChanged(s.id),
    [onStepIdChanged],
  );

  const handleCloseModal = useCallback(() => {
    closeModal("MODAL_ZCASH_EXPORT_KEY");
  }, [closeModal]);

  const error = ufvkExportError;
  const errorSteps = [];

  if (ufvkExportError) {
    errorSteps.push(2);
  }

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
    closeModal: handleCloseModal,
    openModal,
    onRetry,
    onClose: handleCloseModal,
    ufvk,
    ufvkExportError,
    onStepChange: handleStepChange,
    onUfvkChanged,
    birthday,
    invalidBirthday,
    syncFromZero,
    handleBirthdayChange,
    handleSyncFromZero,
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
