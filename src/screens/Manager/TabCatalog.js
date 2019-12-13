// @flow

import type { Action, State } from "@ledgerhq/live-common/lib/apps";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import React, { useCallback } from "react";
import { View, Button } from "react-native";
import AppsList from "./AppsList";
import LText from "../../components/LText";

type Props = {
  screenProps: {
    state: State,
    dispatch: Action => void,
  },
};

const TabCatalog = ({ screenProps: { state, dispatch } }: Props) => {
  const { apps, installQueue, uninstallQueue, installed, currentAppOp, currentProgress, currentError } = state;

  const search = ""; // TODO Well, you know, this should be in a state, and
  const searchFilter = ({ name, currencyId }) => {
    if (!search) return true;
    const currency = currencyId ? getCryptoCurrencyById(currencyId) : null;
    const terms = `${name} ${
      currency ? `${currency.name} ${currency.ticker}` : ""
      }`;
    return terms.toLowerCase().includes(search.toLowerCase().trim());
  };

  const appsList = apps
    .filter(searchFilter)
    .map((app) => ({
      ...app,
      installed: installed.some(({ name }) => name === app.name),
      canUpdate: installed.some(({ name, updated }) => name === app.name && !updated),
      installing: installQueue.indexOf(app.name) >= 0,
      uninstalling: uninstallQueue.indexOf(app.name) >= 0,
      progress: currentAppOp && currentAppOp.name === app.name ? currentProgress && currentProgress.progress : 0,
      error: currentAppOp && currentAppOp.name === app.name ? currentError : null
    }));

  return (<AppsList
    appsList={appsList}
    dispatch={dispatch}
  />)
};
TabCatalog.navigationOptions = {
  title: "CATALOG",
};

export default TabCatalog;
