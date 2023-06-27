import React, { FC, useContext } from "react";
import { Animated, FlatList, StyleSheet } from "react-native";
import { WalletTabNavigatorScrollContext } from "../../WalletTab/WalletTabNavigatorScrollManager";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ScrollToTopButton: FC = () => {
  const { t } = useTranslation();
  const { scrollY, headerHeight, scrollableRefArray } = useContext(WalletTabNavigatorScrollContext);

  const translateY = scrollY.interpolate({
    inputRange: [800, 850],
    outputRange: [-40, 10],
    extrapolate: "clamp",
  });
  const opacity = scrollY.interpolate({
    inputRange: [800, 850],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const goToTop = () => {
    if (scrollableRefArray.current) {
      const NftListRef = scrollableRefArray.current.find(e => e.key === "WalletNftGallery");
      if (NftListRef?.value instanceof FlatList) {
        NftListRef?.value.scrollToOffset({
          animated: true,
          offset: 0,
        });
      }
    }
  };
  const insets = useSafeAreaInsets();
  return (
    <Animated.View style={styles.root}>
      <Animated.View
        style={[
          styles.button,
          {
            top: insets.top + headerHeight,
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Button
          onPress={() => {
            goToTop();
          }}
          iconName="ArrowTop"
          type="main"
          iconPosition="left"
          size="small"
        >
          {t("common.scrollToTop")}
        </Button>
      </Animated.View>
    </Animated.View>
  );
};

export default ScrollToTopButton;

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    height: 0,
    marginTop: 8,
  },
  button: {
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.48,
    shadowRadius: 12,
    shadowColor: "#000",
  },
});
