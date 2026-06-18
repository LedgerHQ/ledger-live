import React, { type RefObject } from "react";

export const previousRouteNameRef: RefObject<string | null | undefined> = React.createRef();
export const currentRouteNameRef: RefObject<string | null | undefined> = React.createRef();

/** Route names for analytics, normalized to "" when unknown. */
export const getCurrentTrackingPage = (): string => currentRouteNameRef.current ?? "";
export const getPreviousTrackingPage = (): string => previousRouteNameRef.current ?? "";
