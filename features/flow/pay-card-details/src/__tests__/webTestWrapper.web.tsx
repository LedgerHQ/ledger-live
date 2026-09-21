import React from "react";
import { StyleProvider } from "@features/platform-style";
import { I18nWrapper } from "./i18nWrapper";

export function WebTestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StyleProvider colorScheme="dark">
      <I18nWrapper>{children}</I18nWrapper>
    </StyleProvider>
  );
}
