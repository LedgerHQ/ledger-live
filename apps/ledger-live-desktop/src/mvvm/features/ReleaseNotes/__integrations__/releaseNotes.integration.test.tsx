import React from "react";
import { render, screen, act } from "tests/testSetup";
import ReleaseNotes from "../index";
import { openReleaseNotes } from "../releaseNotesDialog";
import { MOCK_RELEASE_NOTES } from "../__tests__/helpers";

jest.mock("../../../../../release-notes.json", () => [
  { tag_name: "2.80.0", body: "## What's new\n\n- Feature A\n- Feature B" },
  { tag_name: "2.79.0", body: "## Bug fixes\n\n- Fix X\n- Fix Y" },
]);

const renderReleaseNotes = () => render(<ReleaseNotes />);

describe("ReleaseNotes Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not render dialog content when closed", () => {
    renderReleaseNotes();

    expect(screen.queryByText("Release note")).not.toBeInTheDocument();
  });

  it("should open the dialog and display release notes content", () => {
    const { store } = renderReleaseNotes();

    act(() => {
      store.dispatch(openReleaseNotes());
    });

    expect(screen.getByRole("dialog", { name: "Release note" })).toBeVisible();
    expect(screen.getByText(/Ledger Wallet 2\.80\.0/)).toBeVisible();
    expect(screen.getByText(/Ledger Wallet 2\.79\.0/)).toBeVisible();
  });

  it("should render markdown content from release notes data", () => {
    const { store } = renderReleaseNotes();

    act(() => {
      store.dispatch(openReleaseNotes());
    });

    expect(screen.getByText("Feature A")).toBeVisible();
    expect(screen.getByText("Feature B")).toBeVisible();
    expect(screen.getByText("Fix X")).toBeVisible();
    expect(screen.getByText("Fix Y")).toBeVisible();
  });

  it("should display a 'Got it' button", () => {
    const { store } = renderReleaseNotes();

    act(() => {
      store.dispatch(openReleaseNotes());
    });

    expect(screen.getByTestId("release-notes-got-it")).toBeVisible();
    expect(screen.getByText("Got it")).toBeVisible();
  });

  it("should close the dialog when 'Got it' is clicked", async () => {
    const { store, user } = renderReleaseNotes();

    act(() => {
      store.dispatch(openReleaseNotes());
    });
    expect(screen.getByRole("dialog", { name: "Release note" })).toBeVisible();

    await user.click(screen.getByTestId("release-notes-got-it"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should track analytics on dialog open", () => {
    const { track } = jest.requireMock("~/renderer/analytics/segment");
    const { store } = renderReleaseNotes();

    act(() => {
      store.dispatch(openReleaseNotes());
    });

    expect(track).toHaveBeenCalledWith("page_viewed", { page: "Release Notes Dialog" });
  });

  it("should track analytics when Got it is clicked", async () => {
    const { track } = jest.requireMock("~/renderer/analytics/segment");
    const { store, user } = renderReleaseNotes();

    act(() => {
      store.dispatch(openReleaseNotes());
    });
    track.mockClear();

    await user.click(screen.getByTestId("release-notes-got-it"));

    expect(track).toHaveBeenCalledWith("button_clicked", { button: "release_notes_got_it" });
  });

  it("should render all release notes entries", () => {
    const { store } = renderReleaseNotes();

    act(() => {
      store.dispatch(openReleaseNotes());
    });

    const entries = screen.getAllByText(/Ledger Wallet/);
    expect(entries).toHaveLength(MOCK_RELEASE_NOTES.length);
  });
});
