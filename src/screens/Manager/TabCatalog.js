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
  // const { currentProgress, currentError } = state;

  const search = ""; // TODO Well, you know, this should be in a state, and
  const searchFilter = ({ name, currencyId }) => {
    if (!search) return true;
    const currency = currencyId ? getCryptoCurrencyById(currencyId) : null;
    const terms = `${name} ${
      currency ? `${currency.name} ${currency.ticker}` : ""
      }`;
    return terms.toLowerCase().includes(search.toLowerCase().trim());
  };

  const installedApps = state.installed
    .map(i => state.apps.find(a => a.name === i.name))
    .filter(Boolean);
  // .filter(searchFilter);

  const updatableApps = state.installed
    .map(i => state.apps.find(a => a.name === i.name && !i.updated))
    .filter(Boolean);

  const appsList = state.apps
    .filter(searchFilter)
    .map((app) => ({
      ...app,
      installed: state.installed.some(({ name }) => name === app.name),
      canUpdate: state.installed.some(({ name, updated }) => name === app.name && !updated)
    }));
  // .filter(typeFilter);

  const sampleInstall = useCallback(
    () => dispatch({ type: "install", name: "Bitcoin" }),
    [dispatch],
  );
  const sampleUninstall = useCallback(
    () => dispatch({ type: "uninstall", name: "Bitcoin" }),
    [dispatch],
  );

  return <AppsList
    appsList={appsList}
  />

  return (
    <View>
      <LText>{`Updatable apps: ${updatableApps.length}`}</LText>
      <LText>{`Installed apps: ${installedApps.length}`}</LText>
      <View>
        <Button title="Install Bitcoin" onPress={sampleInstall} />
        <Button title="Uninstall Bitcoin" onPress={sampleUninstall} />
      </View>
      <AppsList
        appsList={appsList}
      />
    </View>
  );
};
TabCatalog.navigationOptions = {
  title: "CATALOG",
};

export default TabCatalog;
