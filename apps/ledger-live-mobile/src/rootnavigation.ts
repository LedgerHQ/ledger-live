import { NavigationContainerRef } from "@react-navigation/native";
import * as React from "react";

export const navigationRef =
  React.createRef<NavigationContainerRef<ReactNavigation.RootParamList>>();
export const isReadyRef = React.createRef<boolean>();
export function navigate(name: string, params: unknown) {
  if (isReadyRef.current && navigationRef.current) {
    // Perform navigation if the app has mounted
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    navigationRef.current.navigate(name, params);
  }
}
