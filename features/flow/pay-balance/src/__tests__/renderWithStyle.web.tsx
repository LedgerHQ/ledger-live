import React from "react";
import { render } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import { I18nTestProvider } from "@shared/i18n/testing";

export function renderWithStyle(ui: React.ReactElement) {
  return render(
    <I18nTestProvider>
      <StyleProvider colorScheme="dark">{ui}</StyleProvider>
    </I18nTestProvider>,
  );
}
