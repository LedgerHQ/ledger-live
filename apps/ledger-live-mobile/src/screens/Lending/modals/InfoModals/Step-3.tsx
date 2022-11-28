// $flow
import React, { useCallback } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trans } from "react-i18next";
import { CompositeScreenProps, useNavigation } from "@react-navigation/native";
import BaseInfoModal from "../BaseModal";
import termsImg from "../../../../images/lending-info-3.png";
import { Track } from "../../../../analytics";
import {
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "../../../../components/RootNavigator/types/helpers";
import { LendingInfoNavigatorParamList } from "../../../../components/RootNavigator/types/LendingInfoNavigator";
import { ScreenName } from "../../../../const";
import type { BaseNavigatorStackParamList } from "../../../../components/RootNavigator/types/BaseNavigator";

type Navigation = CompositeScreenProps<
  StackNavigatorProps<LendingInfoNavigatorParamList, ScreenName.LendingInfo3>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function LendingInfoStep3({ route: { params } }: Navigation) {
  const navigation =
    useNavigation<
      StackNavigatorNavigation<
        LendingInfoNavigatorParamList,
        ScreenName.LendingInfo3
      >
    >();
  const onNext = useCallback(() => {
    const n =
      navigation.getParent<
        StackNavigatorNavigation<BaseNavigatorStackParamList>
      >() || navigation;
    n.pop();
    params?.endCallback && params.endCallback();
  }, [navigation, params]);
  return (
    <>
      <Track event="Page Lend Edu completed" onUnmount />
      <BaseInfoModal
        event="Edu step 3"
        title={<Trans i18nKey="transfer.lending.info.3.title" />}
        description={<Trans i18nKey="transfer.lending.info.3.description" />}
        badgeLabel={<Trans i18nKey="transfer.lending.info.3.label" />}
        illustration={
          <View style={styles.imageContainer}>
            <Image
              style={styles.image}
              resizeMode="contain"
              source={termsImg}
            />
          </View>
        }
        ctaLabel={<Trans i18nKey="transfer.lending.info.3.cta" />}
        onNext={onNext}
      />
    </>
  );
}
const styles = StyleSheet.create({
  imageContainer: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
