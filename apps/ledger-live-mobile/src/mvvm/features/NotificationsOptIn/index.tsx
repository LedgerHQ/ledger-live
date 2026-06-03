import React from "react";
import { NotificationsOptInView } from "./NotificationsOptInView";
import { useNotificationsOptInViewModel } from "./useNotificationsOptInViewModel";

export default function NotificationsOptIn() {
  const viewModel = useNotificationsOptInViewModel();
  return <NotificationsOptInView viewModel={viewModel} />;
}

export { useCompleteLazyOnboarding } from "./hooks/useCompleteLazyOnboarding";
