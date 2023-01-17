import React, { MutableRefObject } from "react";

export const previousRouteNameRef: MutableRefObject<string | null | undefined> =
  React.createRef();
export const currentRouteNameRef: MutableRefObject<string | null | undefined> =
  React.createRef();
