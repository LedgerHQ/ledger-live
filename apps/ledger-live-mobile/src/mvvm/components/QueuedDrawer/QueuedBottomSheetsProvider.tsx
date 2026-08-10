import React from "react";
import { useIsFocused } from "@react-navigation/native";
import {
  QueuedBottomSheetsProvider as QueuedBottomSheetsProviderBase,
  type QueuedBottomSheetAdapters,
} from "@shared/ui-queued-bottom-sheet";
import { useSelector } from "~/context/hooks";
import { isModalLockedSelector } from "~/reducers/appstate";
import { bottomSheetGradientByTone } from "LLM/components/BottomSheetGradient";
import { logDrawer } from "./utils/logDrawer";

const useAreBottomSheetsLocked = () => useSelector(isModalLockedSelector);

// Stable adapters object: injects the app-specific behaviour (Redux modal lock, React Navigation
// focus, status-tone gradients, logging) that the shared package must not depend on directly.
const adapters: QueuedBottomSheetAdapters = {
  useAreBottomSheetsLocked,
  useIsScreenFocused: useIsFocused,
  backgroundComponentByTone: bottomSheetGradientByTone,
  log: logDrawer,
};

const QueuedBottomSheetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueuedBottomSheetsProviderBase adapters={adapters}>{children}</QueuedBottomSheetsProviderBase>
);

export default QueuedBottomSheetsProvider;
