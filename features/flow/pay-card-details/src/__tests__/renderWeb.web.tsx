import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { I18nWrapper } from "./i18nWrapper";

function WebProviders({ children }: { children: React.ReactNode }) {
  return (
    <StyleProvider colorScheme="dark">
      <I18nWrapper>{children}</I18nWrapper>
    </StyleProvider>
  );
}

export function renderWeb(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: WebProviders, ...options });
}
