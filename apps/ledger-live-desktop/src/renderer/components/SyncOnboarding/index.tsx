import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Route, Switch, useRouteMatch, RouteComponentProps } from "react-router-dom";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import SyncOnboardingDeviceConnection, {
  SyncOnboardingDeviceConnectionProps,
} from "./DeviceConnection";
import SyncOnboardingManual from "./Manual";
import CompletionScreen from "./Manual/CompletionScreen";

export type SyncOnboardingDeviceConnectionRouteProps = RouteComponentProps<
  SyncOnboardingDeviceConnectionProps
>;

const SyncOnboarding = () => {
  const { path } = useRouteMatch();
  return (
    <Flex width="100%" height="100%" position="relative">
      <Switch>
        <Route exact path={[`${path}/manual`]} render={() => <SyncOnboardingManual />} />
        <Route exact path={`${path}/completion`} render={() => <CompletionScreen />} />
        <Route
          exact
          path={[`${path}/:deviceModelId`, `${path}/connection/:deviceModelId`]}
          render={(routeProps: SyncOnboardingDeviceConnectionRouteProps) => (
            <SyncOnboardingDeviceConnection {...routeProps.match.params} />
          )}
        />
      </Switch>
    </Flex>
  );
};

export default withV3StyleProvider(SyncOnboarding);
