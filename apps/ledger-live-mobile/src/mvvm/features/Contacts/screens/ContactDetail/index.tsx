import React from "react";
import { ContactDetailPage } from "@features/flow-contacts";
import { TrackScreen } from "~/analytics";
import { useContactDetailScreenViewModel } from "./useContactDetailScreenViewModel";

export function ContactDetailScreen(): React.JSX.Element | null {
  const viewModel = useContactDetailScreenViewModel();

  if (viewModel.status === "redirecting") {
    return null;
  }

  return (
    <>
      <TrackScreen category="Contacts" />
      <ContactDetailPage {...viewModel.pageProps} />
    </>
  );
}
