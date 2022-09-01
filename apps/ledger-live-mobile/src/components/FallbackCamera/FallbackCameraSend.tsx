import React from "react";
import { TFunction } from "i18next";

export type Props = {
  navigation: any;
  t: TFunction;
  route: {
    params: RouteParams;
  };
};
type RouteParams = {
  screenName: string;
};

export type Export = React.ComponentType<Props>;

/* DUMMY */
export default function FallbackCameraSend(_: Props) {
  return <></>;
}
