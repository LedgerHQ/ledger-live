import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { Button, Flex, Text } from "@ledgerhq/native-ui";
import LText from "~/components/LText";
import ExternalLink from "~/components/ExternalLink";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";
import NavigationScrollView from "~/components/NavigationScrollView";
import Illustration from "~/images/illustration/Illustration";
import EarnLight from "~/images/illustration/Light/_003.webp";
import EarnDark from "~/images/illustration/Dark/_003.webp";
import { urls } from "~/utils/urls";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { CardanoVoteDelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<
  CardanoVoteDelegationFlowParamList,
  ScreenName.CardanoVoteDelegationStarted
>;

export default function VoteDelegationStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onNext = useCallback(
    (option: "DRep" | "noConfidence" | "abstain") => {
      if (option === "DRep") {
        navigation.navigate(ScreenName.CardanoVoteDelegationSelectDRep, {
          ...route.params,
        });
      } else {
        navigation.navigate(ScreenName.CardanoVoteDelegationSummary, {
          ...route.params,
          option,
          drep: undefined,
        });
      }
    },
    [navigation, route.params],
  );

  const howDelegationWorks = useCallback(() => {
    Linking.openURL(urls.cardanoStaking); // we might need a separate URL for DRep in the future
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen
          category="VoteDelegationFlow"
          name="Step Starter"
          screen="Started"
          flow="vote_delegate"
          action="delegation"
          currency="cardano"
        />
        <Flex alignItems="center" mb={6}>
          <Illustration lightSource={EarnLight} darkSource={EarnDark} size={150} />
        </Flex>
        <Text fontWeight="semiBold" style={styles.description}>
          <Trans i18nKey="cardano.voteDelegation.flow.steps.starter.description" />
        </Text>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[
            <Trans key="0" i18nKey="cardano.voteDelegation.flow.steps.starter.bullet.0" />,
            <Trans key="1" i18nKey="cardano.voteDelegation.flow.steps.starter.bullet.1" />,
            <Trans key="2" i18nKey="cardano.voteDelegation.flow.steps.starter.bullet.2" />,
          ].map((wording, index) => (
            <LText semiBold key={index}>
              {wording}
            </LText>
          ))}
        />
        <View style={[styles.howDelegationWorks]}>
          <ExternalLink
            event="VoteDelegationStartedHowDelegationWorks"
            onPress={howDelegationWorks}
            text={<Trans i18nKey="delegation.howDelegationWorks" />}
          />
        </View>
      </NavigationScrollView>
      <View style={[styles.footer, { borderColor: colors.border }]}>
        <Button
          onPress={() => onNext("DRep")}
          type="main"
          mt={2}
          testID="cardano-vote-delegation-drep-button"
        >
          <Trans i18nKey="cardano.voteDelegation.options.dRep" />
        </Button>
        <Button
          onPress={() => onNext("noConfidence")}
          type="main"
          mt={4}
          testID="cardano-vote-delegation-no-confidence-button"
        >
          <Trans i18nKey="cardano.voteDelegation.options.alwaysNoConfidence" />
        </Button>
        <Button
          onPress={() => onNext("abstain")}
          type="main"
          mt={4}
          testID="cardano-vote-delegation-abstain-button"
        >
          <Trans i18nKey="cardano.voteDelegation.options.alwaysAbstain" />
        </Button>
      </View>
    </View>
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
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: "center",
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
  },
  howDelegationWorks: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
