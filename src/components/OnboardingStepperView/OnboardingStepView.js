// @flow
import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import colors from "../../colors";
import { normalize } from "../../helpers/normalizeSize";
import Question from "../../icons/Question";
import { TrackScreen } from "../../analytics";

import CheckBox from "../CheckBox";
import ConfirmationModal from "../ConfirmationModal";
import LText from "../LText";
import Animation from "../Animation";

export type InfoStepViewProps = {
  trackPage?: string,
  title?: React$Node,
  descs?: React$Node[],
  image?: number,
  lottie?: number,
  lottieStyle?: *,
  bullets?: {
    Icon?: *,
    label?: React$Node,
    title?: React$Node,
    index?: number,
    color?: string,
  }[],
  ctaText?: React$Node,
  ctaWarningModal?: {
    Icon?: *,
    image?: number,
    title: React$Node,
    desc?: React$Node,
    ctaText: React$Node,
  },
  infoModalLink?: { label: React$Node },
  ctaWarningCheckbox?: { desc: React$Node },
  children?: React$Node,
};

export function InfoStepView({
  title,
  descs,
  image,
  lottie,
  lottieStyle,
  bullets,
  ctaText,
  ctaWarningModal,
  ctaWarningCheckbox,
  infoModalLink,
  children,
  onNext,
  sceneColors,
  openInfoModal,
  trackPage,
}: InfoStepViewProps & {
  onNext: () => void,
  sceneColors: string[],
  openInfoModal: () => void,
}) {
  const [primaryColor, accentColor, textColor, bulletColor] = sceneColors;
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
    <View style={styles.infoStepView}>
      {trackPage && <TrackScreen category="Onboarding" name={trackPage} />}
      {image ? (
        <View style={styles.imageContainer}>
          <Image style={styles.image} source={image} resizeMode="contain" />
        </View>
      ) : null}
      {lottie ? (
        <View style={styles.lottieContainer}>
          <Animation source={lottie} style={[styles.image, lottieStyle]} />
        </View>
      ) : null}
      {children ? (
        <View style={styles.childrenContainer}>{children}</View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollArea}>
          {title && (
            <LText bold style={[styles.title, { color: textColor }]}>
              {title}
            </LText>
          )}
          {descs &&
            descs.map((d, i) => (
              <LText
                key={"desc" + i}
                semiBold
                style={[styles.desc, { color: textColor }]}
              >
                {d}
              </LText>
            ))}
          {bullets && (
            <View style={styles.bulletContainer}>
              {bullets.map(({ Icon, title, label, index, color }, i) => (
                <View style={styles.bulletLine} key={i}>
                  <View
                    style={[
                      styles.bulletIcon,
                      { backgroundColor: bulletColor },
                    ]}
                  >
                    {Icon ? (
                      <Icon size={10} color={color || colors.live} />
                    ) : (
                      <LText
                        semiBold
                        style={[styles.label, { color: colors.live }]}
                      >
                        {index || i + 1}
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
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {infoModalLink && (
        <Pressable onPress={openInfoModal} style={styles.linkContainer}>
          <LText semiBold style={[styles.link, { color: textColor }]}>
            {infoModalLink.label}
          </LText>
          <Question size={16} color={textColor} />
        </Pressable>
      )}
      {ctaWarningCheckbox && (
        <View style={styles.warningCheckboxContainer}>
          <CheckBox
            style={styles.checkbox}
            onChange={setHasValidatedCheckbox}
            isChecked={hasValidatedCheckbox}
          />
          <LText
            onPress={() => setHasValidatedCheckbox(!hasValidatedCheckbox)}
            style={[styles.checkboxLabel, { color: textColor }]}
          >
            {ctaWarningCheckbox.desc}
          </LText>
        </View>
      )}

      {ctaText && (
        <Pressable
          style={[
            styles.ctaButton,
            {
              backgroundColor: isDisabled ? "rgba(0,0,0,0.1)" : accentColor,
            },
          ]}
          disabled={isDisabled}
          onPress={ctaWarningModal ? onOpenInfoModal : onNext}
        >
          <LText
            semiBold
            style={[
              styles.ctaLabel,
              { color: isDisabled ? "rgba(0,0,0,0.3)" : primaryColor },
            ]}
          >
            {ctaText}
          </LText>
        </Pressable>
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
  );
}

const styles = StyleSheet.create({
  spacer: { flex: 1 },
  infoStepView: {
    paddingVertical: 24,
    flex: 1,
  },
  childrenContainer: {
    padding: 24,
    flex: 1,
  },
  scrollArea: {},
  title: {
    fontSize: normalize(32),
    marginVertical: 16,
    paddingHorizontal: 24,
  },
  label: { fontSize: 13, lineHeight: 24 },
  desc: { paddingHorizontal: 24, marginVertical: 4 },
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
  warningCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 16,
    marginHorizontal: 24,
  },
  checkbox: { borderRadius: 4, width: 24, height: 24 },
  checkboxLabel: { flex: 1, fontSize: 13, marginLeft: 11 },
  imageContainer: {
    flex: 1,
    minHeight: 200,
    position: "relative",
  },
  lottieContainer: {
    minHeight: 200,
    position: "relative",
  },
  image: { position: "absolute", width: "100%", height: "100%" },
  imagePlaceholder: { flex: 1, flexShrink: 1, flexBasis: 100 },
  ctaButton: {
    height: 50,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
  },
  ctaLabel: {
    fontSize: 15,
  },

  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginVertical: 16,
    marginHorizontal: 24,
    paddingVertical: 16,
  },
  link: {
    fontSize: 15,
    paddingRight: 8,
  },
});
