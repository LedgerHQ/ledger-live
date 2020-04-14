// @flow
import React, { useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import { withNavigation } from "react-navigation";
import { useGlobalSyncState } from "@ledgerhq/live-common/lib/bridge/react";
import type { NavigationScreenProp } from "react-navigation";
import { isUpToDateSelector } from "../../reducers/accounts";
import { networkErrorSelector } from "../../reducers/appstate";
import HeaderErrorTitle from "../../components/HeaderErrorTitle";
import HeaderSynchronizing from "../../components/HeaderSynchronizing";
import Greetings from "./Greetings";
import IconPie from "../../icons/Pie";
import colors from "../../colors";
import Touchable from "../../components/Touchable";

type Props = {
  showDistribution?: boolean,
  nbAccounts: number,
  showGreeting: boolean,
  navigation: { emit: (event: string) => void } & NavigationScreenProp<*>,
};

const PortfolioHeader = ({
  navigation,
  nbAccounts,
  showGreeting,
  showDistribution,
}: Props) => {
  const onRefocus = useCallback(() => {
    navigation.emit("refocus");
  }, [navigation]);

  const onDistributionButtonPress = useCallback(() => {
    navigation.navigate("Distribution");
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

  if (content) {
    return (
      <View style={styles.wrapper}>
        <TouchableWithoutFeedback onPress={onRefocus}>
          <View style={styles.content}>{content}</View>
        </TouchableWithoutFeedback>
        {showDistribution && (
          <View style={styles.distributionButton}>
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
  return null;
};

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
    backgroundColor: colors.white,
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

export default withNavigation(PortfolioHeader);
