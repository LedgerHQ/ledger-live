import { useTranslation } from "react-i18next";
import { UpdateStatus } from "~/renderer/components/Updater/UpdaterContext";
import { useUpdaterStatus } from "./useUpdaterStatus";
import type { UpdaterButtonProps } from "../types";

type StatusConfig = {
  labelKey: string;
  appearance: UpdaterButtonProps["appearance"];
  isLoading: boolean;
};

const STATUS_MAP: Partial<Record<UpdateStatus, StatusConfig>> = {
  "update-available": {
    labelKey: "updater.newUpdateAvailable",
    appearance: "transparent",
    isLoading: false,
  },
  "download-progress": {
    labelKey: "updater.downloadProgress",
    appearance: "transparent",
    isLoading: true,
  },
  error: {
    labelKey: "updater.errorTryAgain",
    appearance: "red",
    isLoading: false,
  },
  "check-success": {
    labelKey: "updater.installAndRelaunch",
    appearance: "transparent",
    isLoading: false,
  },
};

const useUpdaterViewModel = (): UpdaterButtonProps | null => {
  const { context, isTopBarVisible, getActionHandler } = useUpdaterStatus();
  const { t } = useTranslation();

  if (!context || !isTopBarVisible) return null;

  const { status, downloadProgress } = context;
  const config = STATUS_MAP[status];

  if (!config) return null;

  const { labelKey, ...rest } = config;

  return {
    ...rest,
    label: t(labelKey, { progress: downloadProgress }),
    onClick: getActionHandler(status),
  };
};

export default useUpdaterViewModel;
