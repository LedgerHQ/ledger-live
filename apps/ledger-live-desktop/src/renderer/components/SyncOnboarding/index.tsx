import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Route, Switch, useRouteMatch, RouteComponentProps } from "react-router-dom";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import SyncOnboardingDeviceConnection, {
  SyncOnboardingDeviceConnectionProps,
} from "./DeviceConnection";
import SyncOnboardingManual, { SyncOnboardingManualProps } from "./Manual";
import CompletionScreen from "./Manual/CompletionScreen";

export type DeviceConnectionRouteProps = RouteComponentProps<SyncOnboardingDeviceConnectionProps>;
export type ManualRouteProps = RouteComponentProps<SyncOnboardingManualProps>;

const SyncOnboarding = () => {
  const { path } = useRouteMatch();
  return (
    <Flex width="100%" height="100%" position="relative">
      <Switch>
        <Route
          exact
          path={[`${path}/manual/:deviceModelId`]}
          render={(routeProps: ManualRouteProps) => (
            <SyncOnboardingManual {...routeProps.match.params} />
          )}
        />
        <Route exact path={`${path}/completion`} render={() => <CompletionScreen />} />
        <Route
          exact
          path={[`${path}/:deviceModelId`, `${path}/connection/:deviceModelId`]}
          render={(routeProps: DeviceConnectionRouteProps) => (
            <SyncOnboardingDeviceConnection {...routeProps.match.params} />
          )}
        />
      </Switch>
    </Flex>
  );
};

export default withV3StyleProvider(SyncOnboarding);
