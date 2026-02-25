import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type {
  FlowStep,
  FlowStepConfig,
  StepRegistry,
  FlowConfig,
} from "@ledgerhq/live-common/flows/wizard/types";

type ScreenComponentFunction = (props: Record<string, never>) => React.JSX.Element | null;

export type ReactNativeFlowStepConfig<TStep extends FlowStep = FlowStep> = FlowStepConfig<TStep> &
  Readonly<{
    screenName?: string;
    screenOptions?: NativeStackNavigationOptions;
    initialParams?: Record<string, unknown>;
    listeners?: Record<string, unknown>;
  }>;

export type ReactNativeFlowConfig<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends ReactNativeFlowStepConfig<TStep> = ReactNativeFlowStepConfig<TStep>,
> = FlowConfig<TStep, TStepConfig>;

export type FlowStackNavigatorProps<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends ReactNativeFlowStepConfig<TStep> = ReactNativeFlowStepConfig<TStep>,
> = Readonly<{
  stepRegistry: StepRegistry<TStep>;
  flowConfig: ReactNativeFlowConfig<TStep, TStepConfig>;
  screenOptions?: NativeStackNavigationOptions;
  getScreenName?: (step: TStep) => string;
  getScreenOptions?: (step: TStep, config: TStepConfig) => NativeStackNavigationOptions;
  getInitialParams?: (step: TStep, config: TStepConfig) => Record<string, unknown>;
  onClose?: () => void;
}>;

export type StackScreenConfig<TStep extends FlowStep = FlowStep> = Readonly<{
  step: TStep;
  name: string;
  component: ScreenComponentFunction;
  options?: NativeStackNavigationOptions;
  initialParams?: Record<string, unknown>;
  listeners?: Record<string, unknown>;
}>;
