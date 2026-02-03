import { KNOWN_TOPICS } from "@ledgerhq/live-common/families/internet_computer/consts";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import type { InternetComputerNeuronManageFlowParamList, KnownTopic } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerNeuronManageFlowParamList,
    ScreenName.InternetComputerNeuronFollowSelectTopic
  >
>;

const topicsList = Object.entries(KNOWN_TOPICS);

export default function FollowSelectTopic({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const onSelectTopic = useCallback(
    (topic: KnownTopic) => {
      navigation.navigate(ScreenName.InternetComputerNeuronFollowSelectFollowees, {
        ...route.params,
        followTopic: topic,
      });
    },
    [navigation, route.params],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen
        category="ICP Neuron Management"
        name="FollowSelectTopic"
        flow="manage"
        action="follow"
        currency="internet_computer"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="h4" fontWeight="semiBold" mb={2}>
            <Trans i18nKey="icp.neuronManage.followSelectTopic.title" />
          </Text>
          <Text variant="body" color="neutral.c70">
            <Trans i18nKey="icp.neuronManage.followSelectTopic.description" />
          </Text>
        </View>

        <View style={[styles.warningBox]}>
          <Text variant="body" color="warning.c50">
            <Trans i18nKey="icp.neuronManage.followSelectTopic.warning" />
          </Text>
        </View>

        <View style={styles.topicsSection}>
          <Text variant="body" fontWeight="semiBold" mb={3}>
            <Trans i18nKey="icp.neuronManage.followSelectTopic.selectTopic" />
          </Text>

          {topicsList.map(([key, name]) => (
            <TouchableOpacity
              key={key}
              style={[styles.topicCard, { borderColor: colors.border }]}
              onPress={() => onSelectTopic(parseInt(key, 10) as KnownTopic)}
            >
              <View style={styles.topicHeader}>
                <Text variant="body" fontWeight="semiBold">
                  {name}
                </Text>
                <Text variant="small" color="primary.c80">
                  <Trans i18nKey="common.select" />
                </Text>
              </View>
              <Text variant="small" color="neutral.c70" mt={1}>
                {t(`icp.neuronManage.followTopic.${key}.description`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF9500",
    marginBottom: 24,
  },
  topicsSection: {
    marginTop: 8,
  },
  topicCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
