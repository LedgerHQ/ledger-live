import React, { useCallback, useMemo } from "react";
import invariant from "invariant";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { ModalBody } from "~/renderer/components/Modal";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import Breadcrumb from "./Breadcrumb";
export type BasicStepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
};
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
  ...props
}: Props<T, StepProps>) => {
  const deviceBlocked = useDeviceBlocked();
  const transitionTo = useCallback(
    stepId => {
      const stepIndex = steps.findIndex(s => s.id === stepId);
      const step = steps[stepIndex];
      invariant(step, "Stepper: step %s doesn't exists", stepId);
      onStepChange(step);
    },
    [onStepChange, steps],
  );
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
    onClose,
    t,
    transitionTo,
  };
  return (
    <ModalBody
      refocusWhenChange={stepId}
      onClose={hideCloseButton || deviceBlocked ? undefined : onClose}
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
          <StepComponent {...(stepProps as React.PropsWithChildren<StepProps>)} />
          {children}
        </>
      )}
      renderFooter={
        StepFooter
          ? () => <StepFooter {...(stepProps as React.PropsWithChildren<StepProps>)} />
          : undefined
      }
    />
  );
};
export default withTranslation()(Stepper) as <T, StepProps>(
  props: OwnProps<T, StepProps>,
) => JSX.Element; // to preserve the generic types
