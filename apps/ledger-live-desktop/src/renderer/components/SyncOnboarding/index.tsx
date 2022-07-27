import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Redirect, Route, Switch, useRouteMatch, RouteComponentProps, useParams } from "react-router-dom";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import SyncOnboardingPairing, { SyncOnboardingPairingProps } from "./Pairing";
import SyncOnboardingManual from "./Manual";
import CompletionScreen from "./Manual/CompletionScreen";

export type SyncOnboardingPairingRouteProps = RouteComponentProps<SyncOnboardingPairingProps>;

const SyncOnboarding = () => {
  const { path } = useRouteMatch();

  return (
    <Flex width="100%" height="100%" position="relative">
      <Switch>
        <Route
          exact
          path={`${path}/:deviceModelId`}
          render={(props: SyncOnboardingPairingRouteProps) => <Redirect to={`${path}/pairing/${props.match.params.deviceModelId}`} />}
        />
        <Route path={`${path}/pairing/:deviceModelId`} render={(props: SyncOnboardingPairingRouteProps) => <SyncOnboardingPairing {...props.match.params} />} />
        <Route path={`${path}/manual`} render={props => <SyncOnboardingManual {...props} />} />
        <Route path={`${path}/completion`} render={props => <CompletionScreen {...props} />} />
      </Switch>
    </Flex>
  );
};

export default withV3StyleProvider(SyncOnboarding);
