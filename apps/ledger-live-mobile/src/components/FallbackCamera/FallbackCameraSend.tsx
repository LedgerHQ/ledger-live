import React from "react";
import { TFunction } from "i18next";
import { StackNavigatorProps } from "../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../RootNavigator/types/BaseNavigator";
import { ScreenName } from "../../const";

export type Navigation = StackNavigatorProps<
  BaseNavigatorStackParamList,
  ScreenName.FallbackCameraSend
>;

export type Props = {
  t: TFunction;
} & Navigation;

export type Export = React.ComponentType<Props>;

/* DUMMY */
export default function FallbackCameraSend(_: Navigation) {
  return <></>;
}
