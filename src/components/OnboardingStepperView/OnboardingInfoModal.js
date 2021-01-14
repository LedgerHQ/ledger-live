// @flow
import React, { useCallback } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { rgba } from "../../colors";
import Styles from "../../navigation/styles";
import getWindowDimensions from "../../logic/getWindowDimensions";

import LText from "../LText";
import Close from "../../icons/Close";

import { infoModalScenes } from "../../screens/Onboarding/shared/infoPagesData";

export type SceneInfoProp = {
  title?: React$Node,
  desc?: React$Node,
  link?: { label: React$Node, url: string },
  bullets?: {
    Icon: *,
    title?: React$Node,
    label?: React$Node,
    color?: string,
    link?: { label: React$Node, url: string },
  }[],
};

type Props = {
  navigation: *,
  route: {
    params: { sceneInfoKey: string },
  },
};

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};
const { height } = getWindowDimensions();

export default function OnboardingInfoModal({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { sceneInfoKey } = route.params;
  const sceneInfoProps = infoModalScenes[sceneInfoKey];
  const close = useCallback(() => navigation.goBack(), [navigation]);

  const [primaryColor, textColor, bulletColor] = [
    colors.card,
    colors.darkBlue,
    colors.lightLive,
  ];

  return sceneInfoProps ? (
    <SafeAreaView style={[styles.root, { backgroundColor: primaryColor }]}>
      <View style={[styles.header]}>
        <View style={styles.topHeader}>
          <Pressable hitSlop={hitSlop} style={styles.buttons} onPress={close}>
            <Close size={18} color={textColor} />
          </Pressable>
        </View>
      </View>
      <ScrollView style={styles.root}>
        {sceneInfoProps.map(({ title, desc, link, bullets }, i) => (
          <View key={`infoModalSection-${i}`}>
            {title && (
              <LText bold style={[styles.title, { color: textColor }]}>
                {title}
              </LText>
            )}
            {desc && (
              <LText semiBold style={[styles.desc, { color: textColor }]}>
                {desc}
              </LText>
            )}
            {link && (
              <Pressable
                style={styles.desc}
                onPress={() => {
                  Linking.canOpenURL(link.url) && Linking.openURL(link.url);
                }}
              >
                <LText semiBold style={[styles.link, { color: colors.live }]}>
                  {link.label}
                </LText>
              </Pressable>
            )}
            {bullets && (
              <View style={styles.bulletContainer}>
                {bullets.map(
                  ({ Icon, title, label, color, link: bulletLink }, i) => (
                    <View style={styles.bulletLine} key={i}>
                      <View
                        style={[
                          styles.bulletIcon,
                          {
                            backgroundColor: color
                              ? rgba(colors[color], 0.1)
                              : bulletColor,
                          },
                        ]}
                      >
                        {Icon ? (
                          <Icon
                            size={10}
                            color={color ? colors[color] : colors.live}
                          />
                        ) : (
                          <LText
                            semiBold
                            style={[styles.label]}
                            color={color || "live"}
                          >
                            {i + 1}
                          </LText>
                        )}
                      </View>
                      <View style={styles.bulletTextContainer}>
                        {title && (
                          <LText
                            semiBold
                            style={[styles.bulletTitle, { color: textColor }]}
                          >
                            {title}
                          </LText>
                        )}
                        <LText style={[styles.label, { color: textColor }]}>
                          {label}
                        </LText>
                        {bulletLink && (
                          <Pressable
                            onPress={() => {
                              Linking.canOpenURL(bulletLink.url) &&
                                Linking.openURL(bulletLink.url);
                            }}
                          >
                            <LText
                              semiBold
                              style={[styles.label, { color: colors.live }]}
                            >
                              {bulletLink.label}
                            </LText>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  ),
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  ) : null;
}

const styles = StyleSheet.create({
  modal: {
    height,
    justifyContent: "flex-start",
    margin: 0,
  },
  root: {
    flex: 1,
    paddingBottom: 24,
  },
  topHeader: {
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "flex-end",
  },
  spacer: { flex: 1 },
  header: {
    ...Styles.headerNoShadow,
    backgroundColor: "transparent",
    width: "100%",
    paddingTop: Platform.OS === "ios" ? 0 : 40,
    height: Platform.OS === "ios" ? 40 : 74,
    flexDirection: "column",
    overflow: "hidden",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  buttons: {
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  label: { fontSize: 13, lineHeight: 24 },
  desc: { paddingHorizontal: 24 },
  bulletContainer: {
    flexDirection: "column",
    marginVertical: 8,
    paddingHorizontal: 24,
  },
  bulletIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  bulletLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginVertical: 4,
  },
  bulletTextContainer: {
    flex: 1,
    flexDirection: "column",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    paddingLeft: 20,
  },
  bulletTitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  link: {
    fontSize: 13,
    marginTop: 16,
  },
});
