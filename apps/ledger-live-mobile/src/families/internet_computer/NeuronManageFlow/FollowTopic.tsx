import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import { isDeviceControlledNeuron } from "@ledgerhq/live-common/families/internet_computer/neuron";
import { useICPPrincipal } from "@ledgerhq/live-common/families/internet_computer/react";
import { Flex, ScrollContainer, Text } from "@ledgerhq/native-ui";
import React, { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { TrackScreen } from "~/analytics";
import SafeAreaView from "~/components/SafeAreaView";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useNeuronAction } from "./useNeuronAction";
import MissingNeuron from "./MissingNeuron";
import type { FollowTopic as Topic, InternetComputerNeuronManageFlowParamList } from "./types";

type Props = StackNavigatorProps<
  InternetComputerNeuronManageFlowParamList,
  ScreenName.InternetComputerNeuronFollowTopic
>;

// "Unspecified" is the catch-all default the canister applies when no topic-specific followees are
// set; the others are the concrete governance topics a neuron can follow on.
const TOPICS = Object.keys(KNOWN_TOPICS) as Topic[];

/** Picks the governance topic whose followees the next screen edits. */
export default function FollowTopic({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account, neuron, backToList, transaction, bridge } = useNeuronAction(navigation, route);
  const principal = useICPPrincipal(account);

  // Following is a voting action a hot key may take — except on NeuronManagement, which the
  // canister reserves for the controller (governance.rs, `follow`).
  const isControlled = !!neuron && isDeviceControlledNeuron(neuron, principal);

  const onSelect = useCallback(
    (followTopic: Topic) => {
      const current = transaction ?? route.params.transaction;
      // The transaction is the only place the chosen topic lives, so the topic the next screen shows
      // and the one the device signs cannot drift apart. Changing topic re-seeds the list from that
      // topic's current followees — `follow` replaces the whole list, so an untouched submission has
      // to be a no-op rather than a wipe — while re-picking the same one keeps an edit in progress.
      const next =
        current.followTopic === followTopic
          ? current
          : bridge.updateTransaction(current, {
              followTopic,
              followeesIds: (
                neuron?.followees.find(f => f.topic === KNOWN_TOPICS[followTopic])?.followeeIds ??
                []
              ).map(id => id.toString()),
            });
      navigation.navigate(ScreenName.InternetComputerNeuronFollowees, {
        ...route.params,
        transaction: next,
      });
    },
    [bridge, navigation, neuron, route.params, transaction],
  );

  if (!neuron) return <MissingNeuron onBackToList={backToList} />;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} isFlex>
      <TrackScreen
        category="Manage Neurons ICP Flow"
        name="FollowTopic"
        flow="stake"
        action="follow"
      />
      <ScrollContainer contentContainerStyle={{ padding: 16 }}>
        <Text variant="body" color="neutral.c70" mb={5}>
          {t("internetComputer.manageNeuronFlow.followTopic.description")}
        </Text>
        {TOPICS.map(topic => {
          const followees = neuron?.followees.find(f => f.topic === KNOWN_TOPICS[topic]);
          const controllerOnly = topic === "NeuronManagement" && !isControlled;
          return (
            <TouchableOpacity
              key={topic}
              disabled={controllerOnly}
              onPress={() => onSelect(topic)}
              activeOpacity={0.7}
              testID={`icp-follow-topic-${topic}`}
            >
              <Flex
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                backgroundColor="neutral.c20"
                borderRadius={8}
                opacity={controllerOnly ? 0.4 : 1}
                p={5}
                mb={3}
              >
                <Text variant="body" fontWeight="semiBold" color="neutral.c100">
                  {topic}
                </Text>
                <Text variant="small" color="neutral.c70">
                  {t("internetComputer.manageNeuronFlow.followTopic.followeeCount", {
                    count: followees?.followeeIds.length ?? 0,
                  })}
                </Text>
              </Flex>
            </TouchableOpacity>
          );
        })}
      </ScrollContainer>
    </SafeAreaView>
  );
}
