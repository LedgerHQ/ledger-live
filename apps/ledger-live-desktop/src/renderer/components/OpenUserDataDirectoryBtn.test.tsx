import React from "react";
import { files } from "~/renderer/bridge";
import { render, screen } from "tests/testSetup";
import OpenUserDataDirectoryBtn from "./OpenUserDataDirectoryBtn";

describe("OpenUserDataDirectoryBtn", () => {
  it("should open the user data directory through the bridge", async () => {
    const { user } = render(<OpenUserDataDirectoryBtn />);

    await user.click(screen.getByTestId("view-user-data-button"));

    expect(files.openUserDataDirectory).toHaveBeenCalledTimes(1);
  });
});
