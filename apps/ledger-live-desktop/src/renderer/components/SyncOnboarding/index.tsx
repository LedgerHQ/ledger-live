import React from "react";
import { Flex } from "@ledgerhq/react-ui";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";

import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import SyncOnboardingPairing from "./Pairing";
import SyncOnboardingManual from "./Manual";

const SyncOnboarding = () => {
  const { path } = useRouteMatch();

  return (
    <Flex width="100%" height="100%" position="relative">
      <Switch>
        <Route
          exact
          path={path}
          render={() => <Redirect to={`${path}/manual` /* TODO put pairing instead */} />}
        />
        <Route path={`${path}/pairing`} render={props => <SyncOnboardingPairing {...props} />} />
        <Route path={`${path}/manual`} render={props => <SyncOnboardingManual {...props} />} />
      </Switch>
    </Flex>
  );
};

export default withV3StyleProvider(SyncOnboarding);
