import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { track } from "@shared/analytics";
import { ManageAgentsCard } from "./ManageAgentsCard";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

function renderCard(newBadgeLabel?: string) {
  const onOpen = jest.fn();
  render(
    <ManageAgentsCard
      title="Manage your agents"
      description="Let AI agents manage your assets."
      newBadgeLabel={newBadgeLabel}
      page="My Wallet"
      onOpen={onOpen}
    />,
  );
  return { onOpen, user: userEvent.setup() };
}

describe("ManageAgentsCard (Native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it("should track the press with the profile source", async () => {
    const { user } = renderCard();

    await user.press(screen.getByText("Manage your agents"));

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "agent_intent",
      entry: "agent_intent",
      source: "profile",
      page: "My Wallet",
    });
  });

  it("should open Agent Intent on press", async () => {
    const { onOpen, user } = renderCard();

    await user.press(screen.getByText("Manage your agents"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
