import React from "react";
import { LoadingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import type { BaseInitializerStateProps } from "../types";
import { LoadingContent } from "./LoadingContent";

type InstallingAppStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: LoadingStateType.InstallingApp }>
>;

export function InstallingAppState(_: InstallingAppStateProps) {
  return (
    <LoadingContent
      title={<Trans i18nKey="deviceIntentExecutor.initialization.installingApp.title" />}
      testID="device-initializer-installing-app"
    />
  );
}
