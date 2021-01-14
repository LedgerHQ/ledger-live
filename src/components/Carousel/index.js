// @flow

import React, { useState, memo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Swiper from "react-native-swiper";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { setCarouselVisibility } from "../../actions/settings";
import { carouselVisibilitySelector } from "../../reducers/settings";
import LedgerAcademy from "./slides/LedgerAcademy";
import Card from "../Card";
import LText from "../LText";
import Button from "../Button";
import BuyCrypto from "./slides/BuyCrypto";
import BackupPack from "./slides/BackupPack";
import StakeCosmos from "./slides/StakeCosmos";
import StakeAlgo from "./slides/StakeAlgo";
import BlackFriday from "./slides/BlackFriday";
// import Sell from "./slides/Sell";
// import Vote from "./slides/Vote";
import Lending from "./slides/Lending";
import Swap from "./slides/Swap";
import IconClose from "../../icons/Close";

export const getDefaultSlides = () => [
  {
    id: "blackfriday",
    Component: () => <BlackFriday />,
    start: new Date("1 Nov 2020 00:01:00 PST"),
    end: new Date("30 Nov 2020 23:59:00 PST"),
  },
  {
    id: "Lending",
    Component: () => <Lending />,
  },
  {
    id: "swap",
    Component: () => <Swap />,
  },
  {
    id: "backupPack",
    Component: () => <BackupPack />,
  },
  {
    id: "academy",
    Component: () => <LedgerAcademy />,
  },
  {
    id: "buyCrypto",
    Component: () => <BuyCrypto />,
  },
  {
    id: "stakeCosmos",
    Component: () => <StakeCosmos />,
  },
  {
    id: "stakeAlgo",
    Component: () => <StakeAlgo />,
  },
  // TODO enable when ready
  // {
  //   id: "sell",
  //   Component: () => <Sell />,
  // },
  // {
  //   id: "vote",
  //   Component: () => <Vote />,
  // },
];

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

export const CAROUSEL_NONCE: number = 2;

const Carousel = () => {
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const hidden = useSelector(carouselVisibilitySelector);
  const [showDismissConfirmation, setShowDismissConfirmation] = useState(false);

  let slides = getDefaultSlides();
  slides = slides.filter(slide => {
    if (slide.start && slide.start > new Date()) {
      return false;
    }
    if (slide.end && slide.end < new Date()) {
      return false;
    }
    return true;
  });

  const onDismiss = useCallback(() => setShowDismissConfirmation(true), []);

  const onUndo = useCallback(() => setShowDismissConfirmation(false), []);
  const onConfirm = useCallback(
    () => dispatch(setCarouselVisibility(CAROUSEL_NONCE)),
    [dispatch],
  );

  if (!slides.length || hidden >= CAROUSEL_NONCE) {
    // No slides or dismissed, no problem
    return null;
  }

  return (
    <Card style={styles.wrapper}>
      {showDismissConfirmation ? (
        <View style={styles.confirmation}>
          <LText semiBold style={styles.title}>
            <Trans i18nKey="carousel.title" />
          </LText>
          <LText semiBold style={styles.description}>
            <Trans i18nKey="carousel.description" />
          </LText>
          <View style={styles.buttonsWrapper}>
            <Button
              event="ConfirmationModalCancel"
              type="secondary"
              outline
              titleStyle={{ fontSize: 12 }}
              containerStyle={[styles.button, { marginRight: 8 }]}
              title={<Trans i18nKey="carousel.undo" />}
              onPress={onUndo}
            />
            <Button
              event="ConfirmationModalCancel"
              type="primary"
              titleStyle={{ fontSize: 12 }}
              containerStyle={styles.button}
              title={<Trans i18nKey="carousel.confirm" />}
              onPress={onConfirm}
            />
          </View>
        </View>
      ) : (
        <View style={{ height: 100 }}>
          <Swiper
            style={styles.scrollView}
            autoplay
            autoplayTimeout={5}
            showsButtons={false}
            dotStyle={[styles.bullet, { backgroundColor: colors.fog }]}
            activeDotStyle={[
              styles.bullet,
              { backgroundColor: colors.fog, opacity: 1 },
            ]}
          >
            {slides.map(({ id, Component }) => (
              <Component key={id} />
            ))}
          </Swiper>
          <TouchableOpacity
            style={styles.dismissCarousel}
            hitSlop={hitSlop}
            onPress={onDismiss}
          >
            <IconClose color={colors.smoke} size={16} />
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  dismissCarousel: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  bullet: {
    height: 5,
    width: 5,
    borderRadius: 5,
    opacity: 0.5,
    margin: 4,
    marginBottom: -20,
  },
  scrollView: {},
  confirmation: {
    padding: 8,
    alignItems: "center",
  },
  buttonsWrapper: {
    display: "flex",
    flexDirection: "row",
  },
  button: {
    height: 32,
    margin: 8,
  },
  title: {
    fontSize: 14,
    lineHeight: 16,
    marginBottom: 4,
  },
  description: {
    opacity: 0.5,
    fontSize: 12,
    lineHeight: 15,
    textAlign: "center",
  },
  wrapper: {
    margin: 16,
    minHeight: 100,
    position: "relative",
    borderRadius: 4,
    overflow: "hidden",
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowOpacity: 0.03,
        shadowRadius: 8,
        shadowOffset: {
          height: 4,
        },
      },
    }),
  },
});

export default memo<{}>(Carousel);
