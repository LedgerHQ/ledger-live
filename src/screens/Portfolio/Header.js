// @flow
import React, { useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useGlobalSyncState } from "@ledgerhq/live-common/lib/bridge/react";
import { isUpToDateSelector } from "../../reducers/accounts";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import Touchable from "../../components/Touchable";
import Greetings from "./Greetings";
import IconPie from "../../icons/Pie";
import { ScreenName } from "../../const";
import { scrollToTop } from "../../navigation/utils";

type Props = {
  showDistribution?: boolean,
  nbAccounts: number,
  showGreeting: boolean,
};

export default function PortfolioHeader({
  nbAccounts,
  showGreeting,
  showDistribution,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const onDistributionButtonPress = useCallback(() => {
    navigation.navigate(ScreenName.Distribution);
  }, [navigation]);

  const isUpToDate = useSelector(isUpToDateSelector);
  const networkError = useSelector(networkErrorSelector);
  const { pending, error } = useGlobalSyncState();

  const content =
    pending && !isUpToDate ? (
      <HeaderSynchronizing />
    ) : error ? (
      <HeaderErrorTitle
        withDescription
        withDetail
        error={networkError || error}
      />
    ) : showGreeting ? (
      <Greetings nbAccounts={nbAccounts} />
    ) : null;

  if (!content) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <TouchableWithoutFeedback onPress={scrollToTop}>
        <View style={styles.content}>{content}</View>
      </TouchableWithoutFeedback>
      {showDistribution && (
        <View
          style={[styles.distributionButton, { backgroundColor: colors.card }]}
        >
          <Touchable
            event="DistributionCTA"
            onPress={onDistributionButtonPress}
          >
            <IconPie size={16} color={colors.live} />
          </Touchable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    paddingRight: 16,
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
  },
  distributionButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 32,
    alignSelf: "center",
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
