import React, { useCallback, useRef } from "react";
import { Platform } from "react-native";
import { useSelector } from "react-redux";
import { AnnouncementProvider } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";
import { ServiceStatusProvider } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import type { Announcement } from "@ledgerhq/live-common/notifications/AnnouncementProvider/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import VersionNumber from "react-native-version-number";
import Config from "react-native-config";
import { getEnv } from "@ledgerhq/live-env";
import { getNotifications, saveNotifications } from "../../db";
import { useLocale } from "~/context/Locale";
import { cryptoCurrenciesSelector } from "~/reducers/accounts";
import { track } from "~/analytics";
import { lastSeenDeviceSelector } from "~/reducers/settings";
import fetchApi from "../Settings/Debug/__mocks__/announcements";
import networkApi from "../Settings/Debug/__mocks__/serviceStatus";

let notificationsApi: typeof fetchApi;
let serviceStatusApi: typeof networkApi;

if (Config.MOCK || getEnv("MOCK")) {
  notificationsApi = fetchApi;
  serviceStatusApi = networkApi;
}

type Props = {
  children: React.ReactNode;
};
export default function NotificationsProvider({ children }: Props) {
  const { locale } = useLocale();
  const currenciesRaw: CryptoCurrency[] = useSelector(cryptoCurrenciesSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const { currencies, tickers } = currenciesRaw.reduce<{
    currencies: string[];
    tickers: string[];
  }>(
    ({ currencies, tickers }, { id, ticker }) => ({
      currencies: [...currencies, id],
      tickers: [...tickers, ticker],
    }),
    {
      currencies: [],
      tickers: [],
    },
  );
  const { pushToast } = useToasts();
  const initDateRef = useRef<number>();
  const context = {
    language: locale,
    currencies,
    getDate: () => new Date(),
    lastSeenDevice: lastSeenDevice || undefined,
    platform: Platform.OS,
    appVersion: VersionNumber.appVersion ?? undefined,
  };
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
    ({
      announcements,
      seenIds,
      lastUpdateTime,
    }: {
      announcements: Announcement[];
      seenIds: string[];
      lastUpdateTime: number;
    }) =>
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
      if (publishedTime && initDateRef.current && publishedTime > initDateRef.current)
        pushToast({
          id: uuid,
          type: "announcement",
          title: content.title,
          text: content?.text || "",
          icon: icon || "",
        });
    },
    [pushToast, initDateRef],
  );
  const onAnnouncementRead = useCallback(({ uuid, utm_campaign: utmCampaign }: Announcement) => {
    track("Announcement Viewed", {
      uuid,
      utm_campaign: utmCampaign,
    });
  }, []);
  return (
    <AnnouncementProvider
      autoUpdateDelay={60000}
      context={context}
      handleLoad={onLoad}
      handleSave={onSave}
      onNewAnnouncement={onNewAnnouncement}
      onAnnouncementRead={onAnnouncementRead}
      fetchApi={notificationsApi}
    >
      <ServiceStatusProvider
        context={{
          tickers,
        }}
        autoUpdateDelay={60000}
        networkApi={serviceStatusApi}
      >
        {children}
      </ServiceStatusProvider>
    </AnnouncementProvider>
  );
}
