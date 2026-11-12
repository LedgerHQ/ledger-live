import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderManageAgentsCard } from "../../../testing/renderManageAgentsCard";

describe("ManageAgentsCard (Web)", () => {
  it("should render the title, the description and the new badge", () => {
    renderManageAgentsCard((ui, options) => render(ui, options));

    expect(screen.getByText("Manage your agents")).toBeVisible();
    expect(screen.getByText("Let AI agents manage your assets.")).toBeVisible();
    expect(screen.getByText("New")).toBeVisible();
  });

  it("should open Agent Intent", async () => {
    const user = userEvent.setup();
    const { onOpen } = renderManageAgentsCard((ui, options) => render(ui, options));

    await user.click(screen.getByText("Manage your agents"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
