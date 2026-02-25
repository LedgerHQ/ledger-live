import React from "react";
import { useTranslation } from "react-i18next";
import IconUpdate from "~/renderer/icons/Update";
import IconDonjon from "~/renderer/icons/Donjon";
import IconWarning from "~/renderer/icons/TriangleWarning";
import Spinner from "~/renderer/components/Spinner";
import TopBanner, { FakeLink, Content } from "~/renderer/components/TopBanner";
import { TFunction } from "i18next";
import {
  BANNER_VISIBLE_STATUS,
  useUpdaterStatus,
} from "LLD/features/Updater/hooks/useUpdaterStatus";

export const VISIBLE_STATUS = BANNER_VISIBLE_STATUS;

const getContentByStatus = (
  progress: number,
  version: string,
  t: TFunction,
  quitAndInstall?: () => void,
  reDownload?: () => void,
): Record<string, Content> => ({
  "download-progress": {
    Icon: Spinner,
    message: t("update.downloadInProgress"),
    right: t("update.downloadProgress", { progress }),
  },
  checking: {
    Icon: IconDonjon,
    message: t("update.checking"),
  },
  "check-success": {
    Icon: IconUpdate,
    message: t("update.checkSuccess"),
    right: <FakeLink onClick={quitAndInstall}>{t("update.quitAndInstall")}</FakeLink>,
  },
  "downloading-update": {
    Icon: IconUpdate,
    message: t("update.downloadInProgress"),
  },
  "update-available": {
    Icon: IconUpdate,
    message: t("update.updateAvailable", { version }),
  },
  error: {
    Icon: IconWarning,
    message: t("update.error"),
    right: <FakeLink onClick={reDownload}>{t("update.reDownload")}</FakeLink>,
  },
});

const UpdaterTopBanner: React.FC = () => {
  const { context, isBannerVisible, getActionHandler } = useUpdaterStatus();
  const { t } = useTranslation();

  const quitAndInstall = getActionHandler("check-success");
  const reDownload = getActionHandler("error");

  if (!context || !isBannerVisible) return null;
  const { status, downloadProgress, version } = context;
  const content = getContentByStatus(downloadProgress, version!, t, quitAndInstall, reDownload)[
    status
  ];

  if (!content) return null;

  return (
    <TopBanner
      testId="layout-app-update-banner"
      content={content}
      status={context?.status === "error" ? "alertRed" : "legacyWarning"}
    />
  );
};
export default UpdaterTopBanner;
