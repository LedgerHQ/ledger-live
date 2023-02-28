import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { getEnv } from "@ledgerhq/live-common/env";
import { useAnnouncements } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";
import { useTheme } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui";
import { addMockAnnouncement } from "../__mocks__/announcements";
import SettingsRow from "../../../../components/SettingsRow";
import QueuedDrawer from "../../../../components/QueuedDrawer";
import TextInput from "../../../../components/TextInput";
import Touchable from "../../../../components/Touchable";
import LText from "../../../../components/LText";

const formatInputValue = (inputValue: string): string[] | null | undefined => {
  const val: string[] = inputValue
    .replace(/\s/g, "")
    .split(",")
    .filter(Boolean);
  return val.length > 0 ? val : undefined;
};

export default function AddMockAnnouncementButton({
  title,
}: {
  title: string;
}) {
  const { colors } = useTheme();
  const { updateCache } = useAnnouncements();
  const [open, setIsopen] = useState(false);
  const [announcementLink, setAnnouncementLink] = useState("");
  const [notifPlatform, setNotifPlatform] = useState("");
  const [notifAppVersions, setNotifAppVersions] = useState("");
  const [notifLiveCommonVersions, setNotifLiveCommonVersions] = useState("");
  const [notifCurrencies, setNotifCurrencies] = useState("");
  const [notifDeviceVersion, setNotifDeviceVersion] = useState("");
  const [notifDeviceModelId, setNotifDeviceModelId] = useState("");
  const [notifDeviceApps, setNotifDeviceApps] = useState("");
  const [notifLanguages, setNotifLanguages] = useState("");
  const onOpen = useCallback(() => setIsopen(true), []);
  const onClose = useCallback(() => setIsopen(false), []);
  const onConfirm = useCallback(() => {
    const params = {
      currencies: formatInputValue(notifCurrencies),
      platforms: formatInputValue(notifPlatform),
      appVersions: formatInputValue(notifAppVersions),
      liveCommonVersions: formatInputValue(notifLiveCommonVersions),
      languages: formatInputValue(notifLanguages),
    };
    const formattedParams = (Object.keys(params) as Array<keyof typeof params>)
      .filter(k => !!params[k] && params[k]!.length && params[k]!.length > 0)
      .reduce<Partial<typeof params>>(
        (sum, k) => ({ ...sum, [k]: params[k] }),
        {},
      );
    const extra: Partial<{
      content: {
        [k: string]: {
          title: string;
          text: string;
          link: {
            href: string;
            label: string;
          };
        };
      };
    }> = {};

    if (announcementLink) {
      extra.content = {
        en: {
          title: "Hello i have a deep link",
          text: "Test it out!",
          link: {
            href: announcementLink,
            label: `I should link to ${announcementLink}`,
          },
        },
      };
    }

    const ann = {
      ...formattedParams,
      device: {
        modelIds: formatInputValue(notifDeviceModelId),
        versions: formatInputValue(notifDeviceVersion),
        apps: formatInputValue(notifDeviceApps),
      },
      ...extra,
    };
    addMockAnnouncement(ann);
    updateCache();
    onClose();
  }, [
    announcementLink,
    notifCurrencies,
    notifDeviceApps,
    notifDeviceModelId,
    notifDeviceVersion,
    notifLanguages,
    notifPlatform,
    notifAppVersions,
    notifLiveCommonVersions,
    onClose,
    updateCache,
  ]);
  return getEnv("MOCK") ? (
    <>
      <SettingsRow
        title={title}
        desc={"Create a custom announcement to show in the app"}
        iconLeft={<Icons.NewsMedium size={24} color="black" />}
        onPress={onOpen}
      />
      <QueuedDrawer
        isRequestingToBeOpened={open}
        onClose={onClose}
        style={styles.root}
      >
        <TextInput
          placeholder="platform separated by ','"
          value={notifPlatform}
          onChangeText={setNotifPlatform}
        />
        <TextInput
          placeholder="currencies separated by ','"
          value={notifCurrencies}
          onChangeText={setNotifCurrencies}
        />
        <TextInput
          placeholder="deviceVersion separated by ','"
          value={notifDeviceVersion}
          onChangeText={setNotifDeviceVersion}
        />
        <TextInput
          placeholder="deviceModelId separated by ','"
          value={notifDeviceModelId}
          onChangeText={setNotifDeviceModelId}
        />

        <TextInput
          placeholder="deviceApps separated by ','"
          value={notifDeviceApps}
          onChangeText={setNotifDeviceApps}
        />

        <TextInput
          placeholder="languages separated by ','"
          value={notifLanguages}
          onChangeText={setNotifLanguages}
        />

        <TextInput
          placeholder="app versions separated by ','"
          value={notifAppVersions}
          onChangeText={setNotifAppVersions}
        />

        <TextInput
          placeholder="live-common versions separated by ','"
          value={notifLiveCommonVersions}
          onChangeText={setNotifLiveCommonVersions}
        />

        <TextInput
          placeholder="link"
          value={announcementLink}
          onChangeText={setAnnouncementLink}
        />
        <Touchable
          onPress={onConfirm}
          style={[
            styles.cta,
            {
              backgroundColor: colors.live,
            },
          ]}
        >
          <LText color="white">Confirm</LText>
        </Touchable>
      </QueuedDrawer>
    </>
  ) : null;
}
const styles = StyleSheet.create({
  root: {},
  cta: {
    height: 40,
    margin: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
});
