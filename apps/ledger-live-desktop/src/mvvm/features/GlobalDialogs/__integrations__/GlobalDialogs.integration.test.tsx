import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import GlobalDialogs from "../index";
import { openReleaseNotes, closeReleaseNotes } from "../../ReleaseNotes/releaseNotesDialog";

jest.mock("../../../../../release-notes.json", () => [
  { tag_name: "2.80.0", body: "## What's new\n\n- Feature A" },
]);

describe("GlobalDialogs Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing when all dialogs are closed", () => {
    const { container } = render(<GlobalDialogs />);
    expect(container).toBeInTheDocument();
  });

  it("should render ReleaseNotes dialog when opened", async () => {
    const { store } = render(<GlobalDialogs />);

    act(() => {
      store.dispatch(openReleaseNotes());
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Release note" })).toBeVisible();
    });
    expect(screen.getByText(/Ledger Wallet 2\.80\.0/)).toBeVisible();
  });

  it("should hide ReleaseNotes dialog when closed", async () => {
    const { store } = render(<GlobalDialogs />);

    act(() => {
      store.dispatch(openReleaseNotes());
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "Release note" })).toBeVisible();
    });

    act(() => {
      store.dispatch(closeReleaseNotes());
    });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
