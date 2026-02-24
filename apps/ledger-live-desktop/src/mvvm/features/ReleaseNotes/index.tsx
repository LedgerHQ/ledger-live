import React from "react";
import useReleaseNotesViewModel from "./hooks/useReleaseNotesViewModel";
import ReleaseNotesDialogView from "./ReleaseNotesDialogView";

const ReleaseNotes = () => {
  const viewModel = useReleaseNotesViewModel();
  return <ReleaseNotesDialogView {...viewModel} />;
};

export default ReleaseNotes;
