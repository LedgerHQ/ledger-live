import { useVotes } from "@ledgerhq/live-common/lib/families/helium/react";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { TrackScreen } from "../../../analytics";
import BulletList, { BulletGreenCheck } from "../../../components/BulletList";
import Button from "../../../components/Button";
import ExternalLink from "../../../components/ExternalLink";
import NavigationScrollView from "../../../components/NavigationScrollView";
import { urls } from "../../../config/urls";
import { ScreenName } from "../../../const";
import Votes from "./Votes";
import NoOpenProposalsBanner from "../shared/NoOpenProposalsBanner";

type Props = {
  navigation: any;
  route: { params: any };
};

export default function VoteStarted({ navigation, route }: Props) {
  const { colors } = useTheme();

  const hasOpenProposals =
    useVotes().filter(vote => vote.blocksRemaining && vote.blocksRemaining > 0)
      .length > 0;

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.HeliumVoteSummary, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const howVotingWorks = useCallback(() => {
    Linking.openURL(urls.helium.votingPage);
  }, []);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={{ bottom: "always" }}
    >
      {!hasOpenProposals && (
        <NoOpenProposalsBanner
          title={"Sorry there are no open helium proposals at this time. "}
        />
      )}
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="HeliumVoteFlow" name="Started" />
        <Votes />
        <Text fontWeight="semiBold" style={styles.title}>
          <Trans i18nKey="helium.vote.listHeader" />
        </Text>
        <Text style={styles.description}>
          <Trans i18nKey="helium.vote.voteInfo.description" />
        </Text>
        <BulletList
          style={styles.bulletList}
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="helium.vote.voteInfo.bullet.0" />,
            <Trans i18nKey="helium.vote.voteInfo.bullet.1" />,
            <Trans i18nKey="helium.vote.voteInfo.bullet.2" />,
          ].map(wording => (
            <Text fontWeight="semiBold" style={styles.bulletItem} color="black">
              {wording}
            </Text>
          ))}
        />
      </NavigationScrollView>
      <View style={styles.footer}>
        <Button
          disabled={!hasOpenProposals}
          event="VotingStartedBtn"
          onPress={onNext}
          title={<Trans i18nKey="common.continue" />}
          type="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 33,
    paddingVertical: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
  },
  bulletList: {
    paddingHorizontal: 16,
  },
  bulletItem: {
    fontSize: 14,
  },
  howVotingWorks: {
    marginTop: 32,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: "row",
  },
  footer: {
    padding: 16,
  },
});
