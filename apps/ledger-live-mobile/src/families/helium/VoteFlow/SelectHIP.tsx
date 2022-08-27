import { useVotes } from "@ledgerhq/live-common/families/helium/react";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import invariant from "invariant";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { useSelector } from "react-redux";
import { TrackScreen } from "../../../analytics";
import Touchable from "../../../components/Touchable";
import { ScreenName } from "../../../const";
import { accountScreenSelector } from "../../../reducers/accounts";

type Props = {
  account: AccountLike;
  parentAccount?: Account;
  navigation: any;
  route: { params: RouteParams };
};

type RouteParams = {
  accountId: string;
};

export default function SelectHIP({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { account } = useSelector(accountScreenSelector(route));

  invariant(account, "account must be defined");
  invariant(account.type === "Account", "account must be of type Account");

  const votes = useVotes();

  // votes = votes.filter(vote => vote.blocksRemaining > 0);

  const onItemPress = useCallback(
    (vote: any) => {
      navigation.navigate(ScreenName.HeliumVoteSummary, {
        ...route.params,
        vote,
      });
    },
    [navigation, route.params],
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => <VoteRow vote={item} onPress={onItemPress} />,
    [onItemPress, account],
  );

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={{ bottom: "always" }}
    >
      <TrackScreen category="HeliumVoteFlow" name="SelectHIP" />
      <View style={styles.header}>
        <VoteHead />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={votes}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  list: {
    paddingHorizontal: 16,
  },
  footer: {
    padding: 16,
  },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  validatorHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  validatorHeadText: {
    fontSize: 14,
  },
  validatorHeadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  validatorHeadInfo: {
    marginLeft: 5,
  },
  validator: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
  },
  validatorBody: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 12,
  },
  validatorName: {
    fontSize: 14,
  },
  overdelegatedIndicator: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 10,
    top: 34,
    left: 24,
    borderWidth: 1,
  },
  overdelegated: {
    fontSize: 12,
  },
  validatorYield: {
    fontSize: 14,
  },
  validatorYieldFull: {
    opacity: 0.5,
  },
  warningBox: {
    alignSelf: "stretch",
    marginTop: 8,
  },
  providedByContainer: {
    display: "flex",
    flexDirection: "row",
  },
  providedByText: {
    fontSize: 14,
    marginRight: 5,
  },
  infoModalContainerStyle: {
    alignSelf: "stretch",
  },
});

const keyExtractor = (v: any) => v.id;

const VoteHead = () => (
  <View style={styles.validatorHead}>
    <Text
      style={styles.validatorHeadText}
      color="smoke"
      numberOfLines={1}
      fontWeight="semiBold"
    >
      <Trans i18nKey="helium.vote.flow.steps.selectHIP.subtitle" />
    </Text>
  </View>
);
const VoteRow = ({
  onPress,
  vote,
}: {
  onPress: (_: any) => void;
  vote: any;
}) => {
  const onPressT = useCallback(() => {
    onPress(vote);
  }, [vote, onPress]);

  const generateNameWithHip = vote => {
    if (vote.name.includes("HIP")) {
      return vote.name;
    }

    if (vote.tags.primary.includes("HIP")) {
      return `${vote.tags.primary}: ${vote.name}`;
    }

    const matches = vote.description.match(/([HIP]{3})([ .-]?).*?(?=\s)/g);
    if (matches) {
      return `${matches[0]}: ${vote.name}`;
    }

    return vote.name;
  };

  return (
    <Touchable
      event="VoteFlowChooseHIP"
      eventProperties={{
        vote,
      }}
      onPress={onPressT}
    >
      <View style={styles.validator}>
        <View style={styles.validatorBody}>
          <Text
            numberOfLines={1}
            fontWeight="semiBold"
            style={styles.validatorName}
          >
            {vote.name}
          </Text>
          {true ? (
            <Text
              fontWeight="semiBold"
              numberOfLines={1}
              style={styles.overdelegated}
            >
              {generateNameWithHip(vote)}
            </Text>
          ) : null}
        </View>
      </View>
    </Touchable>
  );
};
