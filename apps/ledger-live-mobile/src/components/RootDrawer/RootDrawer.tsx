import React, { useEffect, useState } from "react";

import { EthereumStakingDrawer } from "../../families/ethereum/EthereumStakingDrawer";

import { RootDrawerProvider, useRootDrawerContext } from "../../context/RootDrawerContext";
import { InitialDrawerID, RootDrawerProps } from "./types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { NavigatorName } from "../../const";
import { PTXServicesAppleWarning } from "./InitialDrawers/PTXServicesAppleWarning";
export async function getInitialDrawersToShow(initialDrawers: InitialDrawerID[]) {
  const initialDrawersToShow = await AsyncStorage.multiGet(initialDrawers);

  // if we have a value then the drawer should not be shown
  return initialDrawersToShow
    .map(([key, value]) => (value ? undefined : key))
    .filter((drawer): drawer is InitialDrawerID => !!drawer);
}

export function RootDrawerSelector() {
  const { drawer } = useRootDrawerContext();
  switch (drawer.id) {
    case "EthStakingDrawer":
      return <EthereumStakingDrawer />;
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
    if (!drawer) {
      getInitialDrawersToShow(initialDrawers).then(([id]) => {
        if (id) {
          setInitialDrawers(prev => prev.filter(d => d !== id));
          navigate(NavigatorName.Base, {
            drawer: {
              id,
            },
          });
        }
      });
    }
  }, [drawer, navigate, setInitialDrawers, initialDrawers]);

  return (
    <RootDrawerProvider drawer={drawer}>
      <RootDrawerSelector />
    </RootDrawerProvider>
  );
}
