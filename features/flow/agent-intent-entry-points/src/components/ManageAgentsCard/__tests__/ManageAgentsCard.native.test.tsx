import { render, screen, userEvent } from "@testing-library/react-native";
import { renderManageAgentsCard } from "../../../testing/renderManageAgentsCard";

describe("ManageAgentsCard (Native)", () => {
  it("should render the title, the description and the new badge", () => {
    renderManageAgentsCard((ui, options) => render(ui, options));

    expect(screen.getByText("Manage your agents")).toBeVisible();
    expect(screen.getByText("Let AI agents manage your assets.")).toBeVisible();
    expect(screen.getByText("New")).toBeVisible();
  });

  it("should open Agent Intent", async () => {
    const user = userEvent.setup();
    const { onOpen } = renderManageAgentsCard((ui, options) => render(ui, options));

    await user.press(screen.getByText("Manage your agents"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
