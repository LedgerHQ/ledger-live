import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { ManageAgentsCard } from "../ManageAgentsCard";

function renderCard(newBadgeLabel?: string) {
  const onOpen = jest.fn();
  render(
    <ManageAgentsCard
      title="Manage your agents"
      description="Let AI agents manage your assets."
      newBadgeLabel={newBadgeLabel}
      onOpen={onOpen}
    />,
  );
  return { onOpen, user: userEvent.setup() };
}

describe("ManageAgentsCard (Native)", () => {
  it("should render the title, the description and the new badge", () => {
    renderCard("New");

    expect(screen.getByText("Manage your agents")).toBeVisible();
    expect(screen.getByText("Let AI agents manage your assets.")).toBeVisible();
    expect(screen.getByTestId("manage-agents-card-new-badge")).toBeVisible();
  });

  it("should hide the new badge without a label", () => {
    renderCard();

    expect(screen.queryByTestId("manage-agents-card-new-badge")).toBeNull();
  });

  it("should open Agent Intent", async () => {
    const { onOpen, user } = renderCard();

    await user.press(screen.getByText("Manage your agents"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
