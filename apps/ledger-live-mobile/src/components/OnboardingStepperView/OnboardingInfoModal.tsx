import React, { useCallback } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import { rgba } from "../../colors";
import Styles from "~/navigation/styles";
import getWindowDimensions from "~/logic/getWindowDimensions";
import LText from "../LText";
import Close from "~/icons/Close";
import { infoModalScenes } from "~/screens/Onboarding/shared/infoPagesData";
import { UnionToIntersection } from "~/types/helpers";
import { StackNavigatorProps } from "../RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "../RootNavigator/types/OnboardingNavigator";
import { ScreenName } from "~/const";

export type SceneInfoProp = {
  title?: React.ReactNode;
  desc?: React.ReactNode;
  link?: {
    label: React.ReactNode;
    url: string;
  };
  bullets?: {
    Icon: IconType;
    title?: React.ReactNode;
    label?: React.ReactNode;
    color?: string;
    link?: {
      label: React.ReactNode;
      url: string;
    };
  }[];
};
type InfoModalSceneKey = keyof typeof infoModalScenes;
type InfoModalSceneValues = UnionToIntersection<(typeof infoModalScenes)[InfoModalSceneKey]>;

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingInfoModal
>;

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};
const { height } = getWindowDimensions();
export default function OnboardingInfoModal({ navigation, route }: NavigationProps) {
  const { colors } = useTheme();
  const { sceneInfoKey } = route.params;
  const sceneInfoProps = infoModalScenes[
    sceneInfoKey as keyof typeof infoModalScenes
  ] as InfoModalSceneValues;
  const close = useCallback(() => navigation.goBack(), [navigation]);
  const [primaryColor, textColor, bulletColor] = [colors.card, colors.darkBlue, colors.lightLive];
  return sceneInfoProps ? (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: primaryColor,
        },
      ]}
    >
      <View style={[styles.header]}>
        <View style={styles.topHeader}>
          <TouchableOpacity hitSlop={hitSlop} style={styles.buttons} onPress={close}>
            <Close size={18} color={textColor} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={styles.root}>
        {sceneInfoProps.map((sceneInfoProp, i) => {
          const { Icon, iconColor, title, desc, link } = sceneInfoProp;
          const { bullets } = sceneInfoProp as SceneInfoProp;
          return (
            <View key={`infoModalSection-${i}`}>
              {Icon && (
                <View style={styles.iconContainer}>
                  <Icon
                    size={56}
                    color={iconColor ? colors[iconColor as keyof typeof colors] : colors.live}
                  />
                </View>
              )}
              {title && (
                <LText
                  bold
                  style={[
                    styles.title,
                    {
                      color: textColor,
                    },
                  ]}
                >
                  {title}
                </LText>
              )}
              {desc && (
                <LText
                  style={[
                    styles.desc,
                    {
                      color: textColor,
                    },
                  ]}
                >
                  {desc}
                </LText>
              )}
              {link && (
                <TouchableOpacity
                  style={styles.desc}
                  onPress={() => {
                    Linking.canOpenURL(link.url).then(ok => ok && Linking.openURL(link.url));
                  }}
                >
                  <LText
                    semiBold
                    style={[
                      styles.link,
                      {
                        color: colors.live,
                      },
                    ]}
                  >
                    {link.label}
                  </LText>
                </TouchableOpacity>
              )}
              {bullets && (
                <View style={styles.bulletContainer}>
                  {bullets.map(({ Icon, title, label, color, link: bulletLink }, i) => (
                    <View style={styles.bulletLine} key={i}>
                      <View
                        style={[
                          styles.bulletIcon,
                          {
                            backgroundColor: color
                              ? rgba(colors[color as keyof typeof colors], 0.1)
                              : bulletColor,
                          },
                        ]}
                      >
                        {Icon ? (
                          <Icon
                            size={10}
                            color={color ? colors[color as keyof typeof colors] : colors.live}
                          />
                        ) : (
                          <LText semiBold style={[styles.label]} color={color || "live"}>
                            {i + 1}
                          </LText>
                        )}
                      </View>
                      <View style={styles.bulletTextContainer}>
                        {title && (
                          <LText
                            semiBold
                            style={[
                              styles.bulletTitle,
                              {
                                color: textColor,
                              },
                            ]}
                          >
                            {title}
                          </LText>
                        )}
                        <LText
                          style={[
                            styles.bulletLabel,
                            {
                              color: textColor,
                            },
                          ]}
                        >
                          {label}
                        </LText>
                        {bulletLink && (
                          <TouchableOpacity
                            onPress={() => {
                              Linking.canOpenURL(bulletLink.url).then(
                                ok => ok && Linking.openURL(bulletLink.url),
                              );
                            }}
                          >
                            <LText
                              semiBold
                              style={[
                                styles.label,
                                {
                                  color: colors.live,
                                },
                              ]}
                            >
                              {bulletLink.label}
                            </LText>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
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
  spacer: {
    flex: 1,
  },
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
  label: {
    fontSize: 13,
    lineHeight: 24,
  },
  desc: {
    paddingHorizontal: 24,
  },
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
  bulletLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  link: {
    fontSize: 13,
    marginTop: 16,
  },
  iconContainer: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
