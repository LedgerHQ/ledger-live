import React, { useCallback, useMemo } from "react";
import invariant from "invariant";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { ModalBody } from "~/renderer/components/Modal";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import Breadcrumb from "./Breadcrumb";
import { useTrackAddAccountModal } from "~/renderer/analytics/hooks/useTrackAddAccountModal";
import { useSelector } from "LLD/hooks/redux";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { LedgerError } from "../DeviceAction";
import { HOOKS_TRACKING_LOCATIONS } from "~/renderer/analytics/hooks/variables";

export type Step<T, StepProps> = {
  id: T;
  label?: React.ReactNode;
  excludeFromBreadcrumb?: boolean;
  component: React.FC<StepProps> | React.ComponentType<StepProps>;
  footer?: React.FC<StepProps> | React.ComponentType<StepProps>;
  onBack?: ((a: StepProps) => void) | null;
  backButtonComponent?: React.ReactNode;
  noScroll?: boolean;
  hideFooter?: boolean;
};

type OwnProps<T, StepProps> = {
  title?: React.ReactNode;
  stepId: T;
  onStepChange: (a: Step<T, StepProps>) => void;
  steps: Step<T, StepProps>[];
  hideBreadcrumb?: boolean;
  onClose?: (a: void) => void;
  disabledSteps?: number[];
  errorSteps?: number[];
  error?: Error | null;
  signed?: boolean;
  children?: React.ReactNode;
  params?: unknown;
  hideCloseButton?: boolean;
  err?: LedgerError | null;
  // Additional props are passed to the step components…
  [key: string]: unknown;
};
type Props<T, StepProps> = OwnProps<T, StepProps> & { t: TFunction } & StepProps;
const Stepper = <T, StepProps>({
  stepId,
  steps,
  onStepChange,
  t,
  hideBreadcrumb,
  title,
  onClose,
  disabledSteps,
  errorSteps,
  children,
  hideCloseButton,
  err,
  ...props
}: Props<T, StepProps>) => {
  const deviceBlocked = useDeviceBlocked();
  const transitionTo = useCallback(
    (stepId: number) => {
      const stepIndex = steps.findIndex(s => s.id === stepId);
      const step = steps[stepIndex];
      invariant(step, "Stepper: step %s doesn't exists", stepId);
      onStepChange(step);
    },
    [onStepChange, steps],
  );
  useTrackAddAccountModal({
    location: HOOKS_TRACKING_LOCATIONS.addAccountModal,
    device: useSelector(getCurrentDevice),
    error: err,
    isTrackingEnabled: useSelector(trackingEnabledSelector),
  });

  const { step, visibleSteps, indexVisible } = useMemo(() => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const step = steps[stepIndex];
    const visibleSteps = steps.filter(s => !s.excludeFromBreadcrumb);
    const indexVisible = Math.min(
      steps.slice(0, stepIndex).filter(s => !s.excludeFromBreadcrumb).length,
      visibleSteps.length - 1,
    );
    return {
      step,
      visibleSteps,
      indexVisible,
    };
  }, [stepId, steps]);
  invariant(step, "Stepper: step %s doesn't exists", stepId);
  const {
    component: StepComponent,
    footer: StepFooter,
    onBack,
    noScroll,
    backButtonComponent,
  } = step;

  // we'll need to improve this. also ...props is bad practice...
  const stepProps = {
    ...props,
    stepId,
    t,
    onClose,
    transitionTo,
  };
  return (
    <ModalBody
      refocusWhenChange={stepId}
      onClose={hideCloseButton || deviceBlocked ? undefined : onClose}
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      onBack={onBack && !deviceBlocked ? () => onBack(stepProps as StepProps) : undefined}
      backButtonComponent={backButtonComponent}
      title={title}
      noScroll={noScroll}
      render={() => (
        <>
          {hideBreadcrumb ? null : (
            <Breadcrumb
              mb={props.error && props.signed ? 4 : 6}
              currentStep={indexVisible}
              items={visibleSteps}
              stepsDisabled={disabledSteps}
              stepsErrors={errorSteps}
            />
          )}
          <StepComponent
            {
              // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
              ...(stepProps as React.PropsWithChildren<StepProps>)
            }
          />
          {children}
        </>
      )}
      renderFooter={
        StepFooter
          ? () => (
              <StepFooter
                {
                  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                  ...(stepProps as React.PropsWithChildren<StepProps>)
                }
              />
            )
          : undefined
      }
    />
  );
};
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export default withTranslation()(Stepper) as <T, StepProps>(
  props: OwnProps<T, StepProps>,
) => React.JSX.Element; // to preserve the generic types
