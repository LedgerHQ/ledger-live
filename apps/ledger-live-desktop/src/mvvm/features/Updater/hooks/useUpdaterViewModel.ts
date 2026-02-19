import { useContext } from "react";
import { useTranslation } from "react-i18next";
import {
  UpdaterContext,
  MaybeUpdateContextType,
  UpdateStatus,
} from "~/renderer/components/Updater/UpdaterContext";
import type { UpdaterButtonProps } from "../types";

const noop = () => {};

type StatusConfig = {
  labelKey: string;
  appearance: UpdaterButtonProps["appearance"];
  isLoading: boolean;
};

const STATUS_MAP: Partial<Record<UpdateStatus, StatusConfig>> = {
  "update-available": {
    labelKey: "updater.newUpdateAvailable",
    appearance: "base",
    isLoading: false,
  },
  "download-progress": {
    labelKey: "updater.downloadProgress",
    appearance: "base",
    isLoading: true,
  },
  error: {
    labelKey: "updater.errorTryAgain",
    appearance: "red",
    isLoading: false,
  },
  "check-success": {
    labelKey: "updater.installAndRelaunch",
    appearance: "base",
    isLoading: false,
  },
};

const useUpdaterViewModel = (): UpdaterButtonProps | null => {
  const context = useContext<MaybeUpdateContextType>(UpdaterContext);
  const { t } = useTranslation();

  if (!context) return null;

  const { status, downloadProgress, quitAndInstall } = context;
  const config = STATUS_MAP[status];

  if (!config) return null;

  const { labelKey, ...rest } = config;

  return {
    ...rest,
    label: t(labelKey, { progress: downloadProgress }),
    onClick: status === "check-success" ? quitAndInstall : noop,
  };
};

export default useUpdaterViewModel;
