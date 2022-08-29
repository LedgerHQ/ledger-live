import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { normalize } from "../../helpers/normalizeSize";
import { Track } from "../../analytics";
import CheckBox from "../CheckBox";
import ConfirmationModal from "../ConfirmationModal";
import LText from "../LText";
import Animation from "../Animation";

export type InfoStepViewProps = {
  trackPage?: string;
  title?: React.ReactNode;
  warning?: React.ReactNode;
  descs?: React.ReactNode[];
  image?: number;
  lottie?: number;
  lottieStyle?: any;
  bullets?: {
    Icon?: any;
    label?: React.ReactNode;
    labels?: React.ReactNode[];
    title?: React.ReactNode;
    index?: number;
    color?: string;
  }[];
  ctaText?: React.ReactNode;
  ctaWarningModal?: {
    Icon?: any;
    image?: number;
    title: React.ReactNode;
    desc?: React.ReactNode;
    ctaText: React.ReactNode;
  };
  ctaWarningCheckbox?: {
    desc: React.ReactNode;
  };
  children?: React.ReactNode;
  ctaEvent?: string;
  isActive?: boolean;
};
export function InfoStepView({
  title,
  warning,
  descs,
  image,
  lottie,
  lottieStyle,
  bullets,
  ctaText,
  ctaEvent = "Proceed",
  ctaWarningModal,
  ctaWarningCheckbox,
  children,
  onNext,
  sceneColors,
  trackPage,
  isActive,
}: InfoStepViewProps & {
  onNext: () => void;
  sceneColors: string[];
}) {
  const { colors } = useTheme();
  const [, accentColor, textColor, bulletColor, , , buttonColor] = sceneColors;
  const [isInfoModalOpen, setInfoModalOpen] = useState(false);
  const onOpenInfoModal = useCallback(() => setInfoModalOpen(true), []);
  const onCloseInfoModal = useCallback(() => setInfoModalOpen(false), []);
  const onConfirmInfo = useCallback(() => {
    onCloseInfoModal();
    onNext();
  }, [onCloseInfoModal, onNext]);
  const [hasValidatedCheckbox, setHasValidatedCheckbox] = useState(false);
  const isDisabled = useMemo(
    () => !!ctaWarningCheckbox && !hasValidatedCheckbox,
    [ctaWarningCheckbox, hasValidatedCheckbox],
  );
  return (
    <>
      {trackPage && isActive && (
        <Track onMount event={`Page Onboarding ${trackPage}`} />
      )}
      <ScrollView style={styles.spacer}>
        <View style={styles.infoStepView}>
          {children || (
            <>
              {image ? (
                <View style={styles.imageContainer}>
                  <Image
                    style={styles.image}
                    source={image}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
              {lottie ? (
                <View style={styles.lottieContainer}>
                  <Animation
                    source={lottie}
                    style={[styles.image, lottieStyle]}
                  />
                </View>
              ) : null}
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
              {warning}
              {descs &&
                descs.map((d, i) => (
                  <LText
                    key={"desc" + i}
                    semiBold
                    style={[
                      styles.desc,
                      {
                        color: textColor,
                      },
                    ]}
                  >
                    {d}
                  </LText>
                ))}
              {bullets && (
                <View style={styles.bulletContainer}>
                  {bullets.map(
                    ({ Icon, title, label, labels, index, color }, i) => (
                      <View style={styles.bulletLine} key={i}>
                        <View
                          style={[
                            styles.bulletIcon,
                            {
                              backgroundColor: bulletColor,
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
                              style={[
                                styles.label,
                                {
                                  color: colors.live,
                                },
                              ]}
                            >
                              {index || i + 1}
                            </LText>
                          )}
                        </View>
                        <View style={styles.bulletTextContainer}>
                          {title ? (
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
                          ) : null}
                          {label ? (
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
                          ) : null}
                          {labels && labels.length > 0
                            ? labels.map((l, j) => (
                                <LText
                                  key={i + j}
                                  style={[
                                    styles.bulletLabel,
                                    {
                                      color: textColor,
                                    },
                                  ]}
                                >
                                  {l}
                                </LText>
                              ))
                            : null}
                        </View>
                      </View>
                    ),
                  )}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
      <View style={styles.ctaContainer}>
        {ctaWarningCheckbox && (
          <View style={styles.warningCheckboxContainer}>
            <CheckBox
              style={styles.checkbox}
              onChange={setHasValidatedCheckbox}
              isChecked={hasValidatedCheckbox}
            />
            <LText
              onPress={() => setHasValidatedCheckbox(!hasValidatedCheckbox)}
              style={[
                styles.checkboxLabel,
                {
                  color: textColor,
                },
              ]}
            >
              {ctaWarningCheckbox.desc}
            </LText>
          </View>
        )}
        {ctaText && (
          <TouchableOpacity
            style={[
              styles.ctaButton,
              {
                backgroundColor: isDisabled ? "rgba(0,0,0,0.1)" : accentColor,
              },
            ]}
            disabled={isDisabled}
            onPress={
              // eslint-disable-next-line @typescript-eslint/no-empty-function
              isDisabled ? () => {} : ctaWarningModal ? onOpenInfoModal : onNext
            }
            testID={isDisabled ? undefined : ctaEvent}
          >
            <LText
              semiBold
              style={[
                styles.ctaLabel,
                {
                  color: isDisabled ? "rgba(0,0,0,0.3)" : buttonColor,
                },
              ]}
            >
              {ctaText}
            </LText>
          </TouchableOpacity>
        )}
        {ctaWarningModal && (
          <ConfirmationModal
            isOpened={isInfoModalOpen}
            onClose={onCloseInfoModal}
            onConfirm={onConfirmInfo}
            confirmationTitle={ctaWarningModal.title}
            confirmationDesc={ctaWarningModal.desc}
            image={ctaWarningModal.image}
            Icon={ctaWarningModal.Icon}
            confirmButtonText={ctaWarningModal.ctaText}
            hideRejectButton
          />
        )}
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  spacer: {
    flex: 1,
  },
  infoStepView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: normalize(32),
    marginVertical: 16,
  },
  label: {
    fontSize: 13,
    lineHeight: 24,
  },
  desc: {
    marginVertical: 4,
  },
  bulletContainer: {
    flexDirection: "column",
    marginVertical: 8,
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
    flexDirection: "column",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flex: 1,
    marginLeft: 20,
  },
  bulletTitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  bulletLabel: {
    fontSize: 13,
    lineHeight: 16,
  },
  warningCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 16,
  },
  checkbox: {
    borderRadius: 4,
    width: 24,
    height: 24,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    marginLeft: 11,
  },
  imageContainer: {
    flex: 0.5,
    minHeight: 150,
    position: "relative",
    marginTop: 24,
  },
  lottieContainer: {
    minHeight: 200,
    position: "relative",
  },
  image: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    flex: 1,
    flexShrink: 1,
    flexBasis: 100,
  },
  ctaButton: {
    height: 50,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontSize: 15,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
});
