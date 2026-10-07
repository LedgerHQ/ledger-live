import React from "react";
import { act, render, screen, waitFor } from "tests/testSetup";
import { copyToClipboard } from "@shared/clipboard";
import { system } from "~/renderer/bridge";
import ReadOnlyAddressField from "../ReadOnlyAddressField";

jest.mock("@shared/clipboard");

const ADDRESS = "bc1qexampleaddress0000000000000000000000";
const MISMATCH = /Mismatch between the copied address/;

const copyAddress = async () => {
  const { user, container } = render(<ReadOnlyAddressField address={ADDRESS} />);
  const copyIcon = container.querySelector("svg");
  if (!copyIcon) throw new Error("copy button not rendered");
  await user.click(copyIcon);
  await waitFor(() => expect(system.clipboardMatchesText).toHaveBeenCalledWith(ADDRESS));
  await act(async () => {});
};

describe("ReadOnlyAddressField", () => {
  beforeEach(() => {
    jest.mocked(copyToClipboard).mockResolvedValue(true);
  });

  it("should copy the address and warn when the clipboard no longer holds it", async () => {
    jest.mocked(system.clipboardMatchesText).mockResolvedValue(false);

    await copyAddress();

    expect(copyToClipboard).toHaveBeenCalledWith(ADDRESS);
    expect(screen.getByText(MISMATCH)).toBeInTheDocument();
  });

  it("should not warn when the clipboard still holds the address", async () => {
    jest.mocked(system.clipboardMatchesText).mockResolvedValue(true);

    await copyAddress();

    expect(screen.queryByText(MISMATCH)).not.toBeInTheDocument();
  });

  it("should not warn when the clipboard cannot be read", async () => {
    jest.mocked(system.clipboardMatchesText).mockResolvedValue(null);

    await copyAddress();

    expect(screen.queryByText(MISMATCH)).not.toBeInTheDocument();
  });
});
