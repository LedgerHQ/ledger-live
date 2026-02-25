import { openDialog, closeDialog } from "~/renderer/reducers/dialogs";
import {
  openReleaseNotes,
  closeReleaseNotes,
  selectIsReleaseNotesOpen,
} from "../releaseNotesDialog";

describe("releaseNotesDialog", () => {
  const buildState = (isOpen: boolean) => ({ dialogs: { RELEASE_NOTES: isOpen } });

  it("should produce an openDialog action with RELEASE_NOTES id", () => {
    expect(openReleaseNotes()).toEqual(openDialog("RELEASE_NOTES"));
  });

  it("should produce a closeDialog action with RELEASE_NOTES id", () => {
    expect(closeReleaseNotes()).toEqual(closeDialog("RELEASE_NOTES"));
  });

  it("should return true when RELEASE_NOTES is open", () => {
    expect(selectIsReleaseNotesOpen(buildState(true))).toBe(true);
  });

  it("should return false when RELEASE_NOTES is closed", () => {
    expect(selectIsReleaseNotesOpen(buildState(false))).toBe(false);
  });

  it("should return false when RELEASE_NOTES is not in state", () => {
    expect(selectIsReleaseNotesOpen({ dialogs: {} })).toBe(false);
  });
});
