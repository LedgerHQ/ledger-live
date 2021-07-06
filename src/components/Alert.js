// @flow
import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Linking,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import { rgba } from "../colors";
import { dismissBanner } from "../actions/settings";
import { dismissedBannersSelector } from "../reducers/settings";

import IconInfo from "../icons/Info";
import IconCheckCircle from "../icons/CheckCircle";
import IconExclamationCircle from "../icons/ExclamationCircle";
import IconWarning from "../icons/Warning";
import IconCloseCircle from "../icons/CloseCircle";
import IconHandShield from "../icons/HandShield";
import IconLightBulb from "../icons/LightBulb";
import IconExternalLink from "../icons/ExternalLink";

const HORIZONTAL_ICON_SIZE = 16;
const BIG_ICON_SIZE = 32;
const VERTICAL_ICON_SIZE = 32;

const hitSlop = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

type AlertType =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "hint"
  | "security"
  | "help"
  | "danger"
  | "update";

type Props = {
  id?: string,
  type: AlertType,
  children: React$Node,
  left?: React$Node,
  bottom?: React$Node,
  title?: string,
  vertical?: boolean,
  noIcon?: boolean,
  closeable?: boolean,
  onLearnMore?: () => any,
  learnMoreKey?: string,
  learnMoreUrl?: string,
  learnMoreIsInternal?: boolean,
};

function useAlertStyle(type: AlertType, vertical?: boolean) {
  const { colors } = useTheme();

  switch (type) {
    case "primary":
      return {
        backgroundColor: colors.pillActiveBackground,
        textColor: colors.live,
        icon: (
          <IconInfo
            color={colors.live}
            size={vertical ? VERTICAL_ICON_SIZE : HORIZONTAL_ICON_SIZE}
          />
        ),
      };
    case "hint":
      return {
        backgroundColor: colors.pillActiveBackground,
        textColor: colors.live,
        icon: (
          <IconLightBulb
            color={colors.live}
            size={vertical ? VERTICAL_ICON_SIZE : HORIZONTAL_ICON_SIZE}
          />
        ),
      };
    case "success":
      return {
        backgroundColor: rgba(colors.success, 0.1),
        textColor: colors.success,
        icon: (
          <IconCheckCircle
            color={colors.success}
            size={vertical ? VERTICAL_ICON_SIZE : HORIZONTAL_ICON_SIZE}
          />
        ),
      };
    case "warning":
      return {
        backgroundColor: rgba(colors.orange, 0.1),
        textColor: colors.orange,
        icon: (
          <IconExclamationCircle
            color={colors.orange}
            size={vertical ? VERTICAL_ICON_SIZE : HORIZONTAL_ICON_SIZE}
          />
        ),
      };
    case "error":
      return {
        backgroundColor: rgba(colors.alert, 0.1),
        textColor: colors.alert,
        icon: (
          <IconCloseCircle
            color={colors.alert}
            size={vertical ? VERTICAL_ICON_SIZE : HORIZONTAL_ICON_SIZE}
          />
        ),
      };
    case "update":
      return {
        backgroundColor: colors.orange,
        textColor: "#FFF",
        icon: (
          <IconWarning
            color={"#FFF"}
            bgColor={colors.orange} // FIXME: refacto icons with only color prop
            size={vertical ? VERTICAL_ICON_SIZE : HORIZONTAL_ICON_SIZE}
          />
        ),
      };
    case "security":
      return {
        backgroundColor: colors.card,
        textColor: colors.text,
        borderColor: colors.fog,
        icon: (
          <IconHandShield
            color={colors.alert}
            size={vertical ? VERTICAL_ICON_SIZE : BIG_ICON_SIZE}
          />
        ),
      };
    case "help":
      return {
        backgroundColor: colors.card,
        textColor: colors.text,
        borderColor: colors.fog,
        icon: (
          <IconHandShield
            color={colors.live}
            size={vertical ? VERTICAL_ICON_SIZE : BIG_ICON_SIZE}
          />
        ),
      };
    case "danger":
      return {
        backgroundColor: colors.card,
        textColor: colors.alert,
        borderColor: colors.fog,
        icon: (
          <IconHandShield
            color={colors.alert}
            size={vertical ? VERTICAL_ICON_SIZE : BIG_ICON_SIZE}
          />
        ),
      };
    case "secondary":
    default:
      return {
        backgroundColor: rgba(colors.smoke, 0.1),
        textColor: colors.smoke,
        icon: (
          <IconInfo
            color={colors.smoke}
            size={vertical ? VERTICAL_ICON_SIZE : HORIZONTAL_ICON_SIZE}
          />
        ),
      };
  }
}

export default function Alert({
  id,
  type = "secondary",
  children: description,
  left,
  bottom,
  title,
  vertical,
  noIcon,
  closeable = false,
  onLearnMore,
  learnMoreUrl,
  learnMoreKey,
  learnMoreIsInternal = false,
}: Props) {
  const dismissedBanners = useSelector(dismissedBannersSelector);
  const dispatch = useDispatch();

  const {
    backgroundColor,
    textColor,
    borderColor = null,
    icon,
  } = useAlertStyle(type, vertical);

  const hasLearnMore = !!onLearnMore || !!learnMoreUrl;
  const handleLearnMore = useCallback(
    () =>
      onLearnMore
        ? onLearnMore()
        : learnMoreUrl
        ? Linking.openURL(learnMoreUrl)
        : undefined,
    [onLearnMore, learnMoreUrl],
  );

  const learnMore = hasLearnMore && (
    <Text onPress={handleLearnMore}>
      {" "}
      <LText
        semiBold
        style={[styles.learnMore, { color: textColor }]}
        fontSize={3}
      >
        <Trans i18nKey={learnMoreKey || "common.learnMore"} />
      </LText>
      {!learnMoreIsInternal && (
        <>
          {" "}
          <IconExternalLink size={12} color={textColor} />
        </>
      )}
    </Text>
  );

  const onDismiss = useCallback(() => {
    if (id) {
      dispatch(dismissBanner(id));
    }
  }, [id, dispatch]);

  const isDismissed = useMemo(() => dismissedBanners.includes(id), [
    dismissedBanners,
    id,
  ]);

  return (
    !isDismissed && (
      <View
        style={[
          styles.root,
          borderColor && styles.withBorder,
          {
            backgroundColor,
            borderColor: borderColor || "transparent",
          },
        ]}
      >
        <View style={[styles.container, vertical && styles.vertical]}>
          {left || (!noIcon && icon) ? (
            <View style={vertical ? styles.topContainer : styles.leftContainer}>
              {left || icon}
            </View>
          ) : null}

          <View style={vertical ? styles.verticalContent : styles.content}>
            {title ? (
              <LText
                semiBold
                style={[
                  vertical && styles.textCentered,
                  {
                    color: textColor,
                  },
                ]}
              >
                {title}
              </LText>
            ) : null}
            <Text
              style={[vertical && styles.textCentered, { color: textColor }]}
            >
              <LText style={[{ color: textColor }]} fontSize={3}>
                {description}
              </LText>
              {learnMore}
            </Text>
          </View>
          {closeable && (
            <TouchableOpacity
              hitSlop={hitSlop}
              style={{ ...styles.container, ...styles.closeContainer }}
              onPress={onDismiss}
            >
              <IconCloseCircle color={textColor} />
            </TouchableOpacity>
          )}
        </View>
        {bottom ? <View style={styles.bottomContainer}>{bottom}</View> : null}
      </View>
    )
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flexDirection: "column",
    borderRadius: 4,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  vertical: {
    width: "100%",
    flexDirection: "column",
  },
  withBorder: {
    borderWidth: 1,
    borderStyle: "dashed",
  },
  leftContainer: {
    marginRight: 16,
  },
  topContainer: {
    marginBottom: 16,
  },
  bottomContainer: {
    marginTop: 16,
  },
  content: {
    flex: 1,
    alignItems: "flex-start",
  },
  verticalContent: {
    flex: 0,
    alignItems: "center",
  },
  textCentered: {
    textAlign: "center",
  },
  learnMore: {
    textDecorationLine: "underline",
    marginTop: 8,
  },
  closeContainer: {
    position: "absolute",
    top: "-20%",
    right: "-3%",
  },
});
