import React from "react";
import useUpdaterViewModel from "./hooks/useUpdaterViewModel";
import UpdaterButtonView from "./UpdaterButtonView";

const Updater = () => {
  const viewModel = useUpdaterViewModel();
  if (!viewModel) return null;
  return <UpdaterButtonView {...viewModel} />;
};

export default Updater;
