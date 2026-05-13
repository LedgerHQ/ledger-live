import React from "react";
import { LoadingStateType, type EnsureAppReadyState } from "@ledgerhq/live-dmk-shared";
import { Trans } from "~/context/Locale";
import type { BaseInitializerStateProps } from "../types";
import { LoadingContent } from "./LoadingContent";

type LoadingStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: LoadingStateType.Loading }>
>;

export function LoadingState(_: LoadingStateProps) {
  return (
    <LoadingContent
      title={<Trans i18nKey="deviceIntentExecutor.initialization.loading.title" />}
      testID="device-initializer-loading"
    />
  );
}
