import React, { useEffect, useState } from "react";

import { EvmStakingDrawer } from "~/families/evm/StakingDrawer";

import { RootDrawerProvider, useRootDrawerContext } from "~/context/RootDrawerContext";
import { InitialDrawerID, RootDrawerProps } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { NavigatorName } from "~/const";
import { PTXServicesAppleWarning } from "./InitialDrawers/PTXServicesAppleWarning";

export async function getInitialDrawersToShow(initialDrawers: InitialDrawerID[]) {
  const initialDrawersToShow = await AsyncStorage.multiGet(initialDrawers);

  // if we have a value then the drawer should not be shown
  return initialDrawersToShow
    .map(([key, value]) => {
      if (value) {
        try {
          const json = JSON.parse(value);
          return json ? undefined : key;
        } catch {
          return undefined;
        }
      }
      return key;
    })
    .filter((drawer): drawer is InitialDrawerID => !!drawer);
}

export function RootDrawerSelector() {
  const { drawer } = useRootDrawerContext();
  switch (drawer.id) {
    case "EvmStakingDrawer":
      return <EvmStakingDrawer />;
    case InitialDrawerID.PTXServicesAppleDrawerKey:
      return <PTXServicesAppleWarning />;
    default:
      return null;
  }
}

export function RootDrawer({ drawer }: RootDrawerProps) {
  // this keeps track initial drawers closed during the session.
  const [initialDrawers, setInitialDrawers] = useState(Object.values(InitialDrawerID));
  const { navigate } = useNavigation<StackNavigationProp<Record<string, object | undefined>>>();

  useEffect(() => {
    async function displayDrawers() {
      if (!drawer) {
        try {
          const [id] = await getInitialDrawersToShow(initialDrawers);
          if (id) {
            setInitialDrawers(prev => prev.filter(d => d !== id));
            navigate(NavigatorName.Base, {
              drawer: {
                id,
              },
            });
          }
        } catch {
          return;
        }
      }
    }
    displayDrawers();
  }, [drawer, navigate, setInitialDrawers, initialDrawers]);

  return (
    <RootDrawerProvider drawer={drawer}>
      <RootDrawerSelector />
    </RootDrawerProvider>
  );
}
