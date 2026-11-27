import React, { type ReactNode } from "react";
import { SettingsPortProvider, type AnySettingsPort } from "@features/flow-settings";
import { I18nWrapper } from "./i18nWrapper";

/** Wraps a tree in the test wording and the given settings port. */
export function makeSettingsWrapper(port: AnySettingsPort) {
  return function SettingsWrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <I18nWrapper>
        <SettingsPortProvider value={port}>{children}</SettingsPortProvider>
      </I18nWrapper>
    );
  };
}
