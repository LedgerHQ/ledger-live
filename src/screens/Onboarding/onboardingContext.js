// @flow

import React, { createContext, PureComponent } from "react";
import hoistNonReactStatic from "hoist-non-react-statics";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";

import getStep from "./steps";

import type {
  OnboardingContextType,
  OnboardingContextProviderProps,
  SetOnboardingModeType,
  SetOnboardingDeviceModelType,
} from "./types";

const INITIAL_CONTEXT: $Shape<OnboardingContextType> = {
  // We assume onboarding always starts at this step
  // in the future we could allow to init with custom value
  currentStep: "OnboardingStepGetStarted",

  // Can be changed on the fly with `setOnboardingMode`
  // prop, passed to steps components
  mode: "full",

  // whether or not should "welcome to ledger live" in first step
  showWelcome: true,

  firstTimeOnboarding: true,

  deviceModelId: "nanoX",
};

// $FlowFixMe
const OnboardingContext = createContext(INITIAL_CONTEXT);

const getStepForState = state => getStep(state.mode, state.firstTimeOnboarding);

// Provide each step screen a set of props used
// in various ways: display the total number of steps,
// navigate between steps, jump, etc.
export class OnboardingContextProvider extends PureComponent<
  OnboardingContextProviderProps,
  OnboardingContextType,
> {
  constructor(props: OnboardingContextProviderProps) {
    super(props);

    this.state = {
      ...INITIAL_CONTEXT,

      setShowWelcome: this.setShowWelcome,
      resetCurrentStep: this.resetCurrentStep,
      nextWithNavigation: this.next,
      prevWithNavigation: this.prev,
      setOnboardingMode: this.setOnboardingMode,
      setOnboardingDeviceModel: this.setOnboardingDeviceModel,
      syncNavigation: this.syncNavigation,
      setFirstTimeOnboarding: this.setFirstTimeOnboarding,
    };
  }

  // Navigate to next step
  // we may want to handle onboarding finish here (e.g update settings)
  next = (navigation: NavigationScreenProp<*>) => {
    const currentStep = navigation.state.routeName;
    const steps = getStepForState(this.state);
    const i = steps.findIndex(s => s.id === currentStep) + 1;
    this.navigate(navigation, i);
  };

  // Navigate to previous step
  prev = (navigation: NavigationScreenProp<*>) => {
    const currentStep = navigation.state.routeName;
    const steps = getStepForState(this.state);
    const i = steps.findIndex(s => s.id === currentStep) - 1;
    this.navigate(navigation, i);
  };

  // Replace current steps with steps of given mode
  setOnboardingMode: SetOnboardingModeType = mode =>
    new Promise(resolve => this.setState({ mode }, resolve));

  setOnboardingDeviceModel: SetOnboardingDeviceModelType = deviceModelId =>
    new Promise(resolve => this.setState({ deviceModelId }, resolve));

  setShowWelcome = (showWelcome: boolean): Promise<void> =>
    new Promise(r => this.setState({ showWelcome }, r));

  setFirstTimeOnboarding = (firstTimeOnboarding: boolean): Promise<void> =>
    new Promise(r => this.setState({ firstTimeOnboarding }, r));

  navigate = (navigation: NavigationScreenProp<*>, index: number) => {
    const steps = getStepForState(this.state);
    if (index === -1 || index === steps.length) return;
    const currentStep = steps[index].id;
    this.setState({ currentStep });
    navigation.navigate(currentStep);
  };

  // hack to make onboarding provider react to navigation change
  // e.g: it can happen when using native gesture for back
  syncNavigation = (routeName: string) => {
    const { currentStep } = this.state;
    if (currentStep !== routeName) {
      this.setState({ currentStep: routeName });
    }
  };

  resetCurrentStep = (): Promise<void> =>
    new Promise(resolve => {
      this.setState(
        state => ({
          currentStep: getStepForState(state)[0].id,
        }),
        resolve,
      );
    });

  render() {
    return (
      <OnboardingContext.Provider value={this.state}>
        {this.props.children}
      </OnboardingContext.Provider>
    );
  }
}

export function withOnboardingContext(Comp: React$ComponentType<any>) {
  // Only purpose of this component is to intercept the
  // `navigation` object given by react-navigation in each
  // screen, and to inject it on next/prev
  type NavInterceptorProps = {
    navigation: NavigationScreenProp<*>,
    syncNavigation: string => void,
    nextWithNavigation: (NavigationScreenProp<*>) => void,
    prevWithNavigation: (NavigationScreenProp<*>) => void,
  };

  class NavigationInterceptor extends PureComponent<NavInterceptorProps> {
    // hack: make onboarding context provider aware of current route
    componentDidMount() {
      this.sub = this.props.navigation.addListener("didFocus", () => {
        this.props.syncNavigation(this.props.navigation.state.routeName);
      });
    }

    componentWillUnmount() {
      this.sub.remove();
    }

    sub: *;

    next = () => this.props.nextWithNavigation(this.props.navigation);
    prev = () => this.props.prevWithNavigation(this.props.navigation);
    render = () => <Comp {...this.props} next={this.next} prev={this.prev} />;
  }

  // Gives component ability to prev/next and change the steps mode
  // for comfort, it also add the translate() decorator
  function WithOnboardingContext(props: any) {
    return (
      <OnboardingContext.Consumer>
        {contextProps => <NavigationInterceptor {...props} {...contextProps} />}
      </OnboardingContext.Consumer>
    );
  }

  hoistNonReactStatic(WithOnboardingContext, Comp);

  WithOnboardingContext.navigationOptions = {
    header: null,
  };

  return translate()(WithOnboardingContext);
}
