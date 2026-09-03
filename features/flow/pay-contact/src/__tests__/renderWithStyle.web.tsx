import React from "react";
import { render } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";

export function renderWithStyle(ui: React.ReactElement) {
  return render(<StyleProvider colorScheme="dark">{ui}</StyleProvider>);
}
