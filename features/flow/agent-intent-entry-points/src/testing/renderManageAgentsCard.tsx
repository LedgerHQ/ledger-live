import React, { type ComponentType, type ReactElement, type ReactNode } from "react";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ManageAgentsCard } from "../components/ManageAgentsCard";

const RESOURCES = {
  en: {
    translation: {
      agentIntent: {
        manageAgents: {
          title: "Manage your agents",
          description: "Let AI agents manage your assets.",
        },
      },
      common: { new: "New" },
    },
  },
};

function I18nWrapper({ children }: Readonly<{ children: ReactNode }>) {
  return <I18nTestProvider resources={RESOURCES}>{children}</I18nTestProvider>;
}

type RenderWithWrapper = (
  ui: ReactElement,
  options: { wrapper: ComponentType<{ children: ReactNode }> },
) => unknown;

export function renderManageAgentsCard(render: RenderWithWrapper) {
  const onOpen = jest.fn();
  render(<ManageAgentsCard onOpen={onOpen} />, { wrapper: I18nWrapper });
  return { onOpen };
}
