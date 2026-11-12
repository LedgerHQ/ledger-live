import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nTestProvider } from "@shared/i18n/testing";
import { ManageAgentsCard } from "../ManageAgentsCard";

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

function renderCard() {
  const onOpen = jest.fn();
  render(<ManageAgentsCard onOpen={onOpen} />, {
    wrapper: ({ children }) => (
      <I18nTestProvider resources={RESOURCES}>{children}</I18nTestProvider>
    ),
  });
  return { onOpen, user: userEvent.setup() };
}

describe("ManageAgentsCard (Web)", () => {
  it("should render the title, the description and the new badge", () => {
    renderCard();

    expect(screen.getByText("Manage your agents")).toBeVisible();
    expect(screen.getByText("Let AI agents manage your assets.")).toBeVisible();
    expect(screen.getByText("New")).toBeVisible();
  });

  it("should open Agent Intent", async () => {
    const { onOpen, user } = renderCard();

    await user.click(screen.getByText("Manage your agents"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
