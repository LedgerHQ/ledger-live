// @flow
import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { useAnnouncements } from "@ledgerhq/live-common/lib/notifications/AnnouncementProvider";
import { addMockAnnouncement } from "./__mocks__/announcements";

import { useTheme } from "@react-navigation/native";
import SettingsRow from "../../../components/SettingsRow";
import BottomModal from "../../../components/BottomModal";
import TextInput from "../../../components/TextInput";
import Touchable from "../../../components/Touchable";
import LText from "../../../components/LText";

const formatInputValue = (inputValue: string): ?(string[]) => {
  const val: string[] = inputValue
    .replace(/\s/g, "")
    .split(",")
    .filter(Boolean);
  return val.length > 0 ? val : undefined;
};

export default function AddMockAnnouncementButton({
  title,
}: {
  title: string,
}) {
  const { colors } = useTheme();
  const { updateCache } = useAnnouncements();
  const [open, setIsopen] = useState(false);

  const [announcementLink, setAnnouncementLink] = useState();
  const [notifPlatform, setNotifPlatform] = useState("");
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
      languages: formatInputValue(notifLanguages),
    };

    const formattedParams: any = Object.keys(params)
      .filter(k => !!params[k] && params[k].length > 0)
      .reduce((sum, k: string) => ({ ...sum, [k]: params[k] }), {});

    const extra = {};

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
    onClose,
    updateCache,
  ]);

  return getEnv("MOCK") ? (
    <>
      <SettingsRow title={title} onPress={onOpen} />
      <BottomModal isOpened={open} onClose={onClose} style={styles.root}>
        <TextInput
          style={styles.textInput}
          placeholder="platform separated by ','"
          value={notifPlatform}
          onChangeText={setNotifPlatform}
        />
        <TextInput
          style={styles.textInput}
          placeholder="currencies separated by ','"
          value={notifCurrencies}
          onChangeText={setNotifCurrencies}
        />
        <TextInput
          style={styles.textInput}
          placeholder="deviceVersion separated by ','"
          value={notifDeviceVersion}
          onChangeText={setNotifDeviceVersion}
        />
        <TextInput
          style={styles.textInput}
          placeholder="deviceModelId separated by ','"
          value={notifDeviceModelId}
          onChangeText={setNotifDeviceModelId}
        />

        <TextInput
          style={styles.textInput}
          placeholder="deviceApps separated by ','"
          value={notifDeviceApps}
          onChangeText={setNotifDeviceApps}
        />

        <TextInput
          style={styles.textInput}
          placeholder="languages separated by ','"
          value={notifLanguages}
          onChangeText={setNotifLanguages}
        />

        <TextInput
          style={styles.textInput}
          placeholder="link"
          value={announcementLink}
          onChangeText={setAnnouncementLink}
        />
        <Touchable
          onPress={onConfirm}
          style={[styles.cta, { backgroundColor: colors.live }]}
        >
          <LText color="white">Confirm</LText>
        </Touchable>
      </BottomModal>
    </>
  ) : null;
}

const styles = StyleSheet.create({
  root: {},
  textInput: {
    margin: 16,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 4,
    paddingHorizontal: 16,
  },
  cta: {
    height: 40,
    margin: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
});
