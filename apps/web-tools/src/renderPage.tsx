import React from "react";
import { createRoot } from "react-dom/client";

import "../pages/globals.css";
import "../live-common-setup";

type PageComponent = React.ComponentType;

export const renderPage = (Page: PageComponent) => {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  root.render(<Page />);
};
