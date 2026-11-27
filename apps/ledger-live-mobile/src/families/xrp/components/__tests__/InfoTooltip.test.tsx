import React from "react";
import { render, screen } from "@tests/test-renderer";
import { InfoTooltip } from "../InfoTooltip";

describe("InfoTooltip", () => {
  it("reveals the info under the title when its icon is pressed", async () => {
    const { user } = render(<InfoTooltip title="Rippling" info="What rippling does" />);

    expect(screen.queryByText("What rippling does")).toBeNull();
    await user.press(screen.getByLabelText("Rippling"));

    const info = await screen.findByText("What rippling does");

    expect(info).toBeVisible();
    expect(screen.getByText("Rippling")).toBeVisible();
  });
});
