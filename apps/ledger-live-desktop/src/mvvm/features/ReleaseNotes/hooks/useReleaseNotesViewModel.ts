import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import releaseNotes from "../../../../../release-notes.json";
import { selectIsReleaseNotesOpen, closeReleaseNotes } from "../releaseNotesDialog";
import { track } from "~/renderer/analytics/segment";
import type { ReleaseNotesViewProps } from "../types";

const useReleaseNotesViewModel = (): ReleaseNotesViewProps => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectIsReleaseNotesOpen);
  const notes = releaseNotes;

  useEffect(() => {
    if (isOpen) {
      track("page_viewed", { page: "Release Notes Dialog" });
    }
  }, [isOpen]);

  const onClose = useCallback(() => {
    dispatch(closeReleaseNotes());
  }, [dispatch]);

  const onGotIt = useCallback(() => {
    track("button_clicked", { button: "release_notes_got_it" });
    onClose();
  }, [onClose]);

  return { isOpen, notes, onClose, onGotIt };
};

export default useReleaseNotesViewModel;
