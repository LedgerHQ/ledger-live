import React from "react";
import { NotificationsPromptQADebugView } from "./NotificationsPromptQADebugView";
import { useNotificationsPromptQADebugViewModel } from "./useNotificationsPromptQADebugViewModel";

export default function NotificationsPromptQADebug() {
  return <NotificationsPromptQADebugView {...useNotificationsPromptQADebugViewModel()} />;
}
