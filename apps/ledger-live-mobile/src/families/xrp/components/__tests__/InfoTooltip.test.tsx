import React from "react";
import { GlobalTooltipBottomSheet } from "@ledgerhq/lumen-ui-rnative";
import { render, screen } from "@tests/test-renderer";
import { InfoTooltip } from "../InfoTooltip";

describe("InfoTooltip", () => {
  it("reveals the info under the title when its icon is pressed", async () => {
    const { user } = render(
      <>
        <InfoTooltip title="Rippling" info="What rippling does" />
        <GlobalTooltipBottomSheet />
      </>,
    );

    expect(screen.queryByText("What rippling does")).toBeNull();
    await user.press(screen.getByLabelText("Rippling"));

    expect(await screen.findByText("What rippling does")).toBeVisible();
  });
});
