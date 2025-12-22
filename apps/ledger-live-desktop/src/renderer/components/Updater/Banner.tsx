import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { urls } from "~/config/urls";
import { openURL } from "~/renderer/linking";
import IconUpdate from "~/renderer/icons/Update";
import IconDonjon from "~/renderer/icons/Donjon";
import IconWarning from "~/renderer/icons/TriangleWarning";
import Spinner from "~/renderer/components/Spinner";
import TopBanner, { FakeLink, Content } from "~/renderer/components/TopBanner";
import { UpdaterContext } from "./UpdaterContext";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { TFunction } from "i18next";

export const VISIBLE_STATUS = [
  "download-progress",
  "checking",
  "check-success",
  "error",
  "update-available",
  "downloading-update",
];

const getContentByStatus = (
  quitAndInstall: () => void,
  reDownload: () => void,
  progress: number,
  version: string,
  t: TFunction,
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
  const context = useContext(UpdaterContext);
  const urlLive = useLocalizedUrl(urls.liveHome);
  const { t } = useTranslation();

  const reDownload = () => openURL(urlLive);

  if (!context?.version || !VISIBLE_STATUS.includes(context.status)) return null;
  const { status, quitAndInstall, downloadProgress, version } = context;
  const content = getContentByStatus(quitAndInstall, reDownload, downloadProgress, version, t)[
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
