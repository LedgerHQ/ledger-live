// @flow
import React, { useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { AnnouncementProvider } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider";
import { ServiceStatusProvider } from "@ledgerhq/live-common/lib/notifications/ServiceStatusProvider";
import { useToasts } from "@ledgerhq/live-common/lib/notifications/ToastProvider/index";
import type { Announcement } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider/types";
import { getNotifications, saveNotifications } from "../../db";
import { useLocale } from "../../context/Locale";
import { cryptoCurrenciesSelector } from "../../reducers/accounts";
import { track } from "../../analytics";

type Props = {
  children: React$Node,
};

export default function NotificationsProvider({ children }: Props) {
  const { locale } = useLocale();
  const c = useSelector(cryptoCurrenciesSelector);
  const currencies = c.map(({ family }) => family);
  const { pushToast } = useToasts();
  const initDateRef = useRef();

  const onLoad = useCallback(
    () =>
      getNotifications().then(dbData => {
        const {
          announcements = [],
          seenIds = [],
          lastUpdateTime = new Date().getTime(),
          initDate = new Date().getTime(),
        } = dbData || {};

        initDateRef.current = initDate;

        return {
          announcements,
          seenIds,
          lastUpdateTime,
        };
      }),
    [],
  );

  const onSave = useCallback(
    ({ announcements, seenIds, lastUpdateTime }) =>
      saveNotifications({
        announcements,
        seenIds,
        lastUpdateTime,
        initDate: initDateRef.current,
      }),
    [initDateRef],
  );

  const onNewAnnouncement = useCallback(
    (announcement: Announcement) => {
      const {
        uuid,
        content,
        icon,
        utm_campaign: utmCampaign,
        published_at: publishedAt,
      } = announcement;

      track("Announcement Received", {
        uuid,
        utm_campaign: utmCampaign,
      });
      const publishedTime = new Date(publishedAt).getTime();

      if (
        publishedTime &&
        initDateRef.current &&
        publishedTime > initDateRef.current
      )
        pushToast({
          id: uuid,
          type: "announcement",
          title: content.title,
          text: content.text,
          icon,
        });
    },
    [pushToast, initDateRef],
  );

  const onAnnouncementRead = useCallback(
    ({ uuid, utm_campaign: utmCampaign }) => {
      track("Announcement Viewed", {
        uuid,
        utm_campaign: utmCampaign,
      });
    },
    [],
  );

  return (
    <AnnouncementProvider
      autoUpdateDelay={60000}
      context={{
        language: locale,
        currencies,
        getDate: () => new Date(),
      }}
      handleLoad={onLoad}
      handleSave={onSave}
      onNewAnnouncement={onNewAnnouncement}
      onAnnouncementRead={onAnnouncementRead}
    >
      <ServiceStatusProvider autoUpdateDelay={60000}>
        {children}
      </ServiceStatusProvider>
    </AnnouncementProvider>
  );
}
