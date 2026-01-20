import React, { type RefObject } from "react";

export const previousRouteNameRef: RefObject<string | null | undefined> = React.createRef();
export const currentRouteNameRef: RefObject<string | null | undefined> = React.createRef();
