import React, { useCallback } from "react";
import { Linking, ScrollView } from "react-native";
import { Trans, useTranslation } from "~/context/Locale";
import { Flex, Text, IconsLegacy, List } from "@ledgerhq/native-ui";
import { isAccountDelegating } from "@ledgerhq/live-common/families/tezos/staking";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { urls } from "~/utils/urls";
import Alert from "~/components/Alert";
import Button from "~/components/wrappedUi/Button";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { TezosDelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<TezosDelegationFlowParamList, ScreenName.TezosEarnRewards>;

const Check = <IconsLegacy.CheckAloneMedium size={18} color="success.c50" />;

const StepPill = ({ label, active }: { label: string; active: boolean }) => (
  <Flex backgroundColor={active ? "primary.c20" : "neutral.c30"} borderRadius={9999} px={5} py={2}>
    <Text variant="small" fontWeight="semiBold" color={active ? "primary.c80" : "neutral.c70"}>
      {label}
    </Text>
  </Flex>
);

const StepCard = ({
  label,
  title,
  subtitle,
  bullets,
  accent,
}: {
  label: string;
  title: string;
  subtitle: string;
  bullets: string[];
  accent: string;
}) => (
  <Flex backgroundColor="neutral.c20" borderRadius={12} padding={6} mb={4}>
    <Text
      variant="small"
      fontWeight="semiBold"
      color={accent}
      mb={3}
      style={{ textTransform: "uppercase", letterSpacing: 1 }}
    >
      {label}
    </Text>
    <Text variant="large" fontWeight="semiBold" mb={1}>
      {title}
    </Text>
    <Text variant="body" color="neutral.c70" mb={4}>
      {subtitle}
    </Text>
    <List
      items={bullets.map(b => ({ title: b, bullet: Check }))}
      itemContainerProps={{ alignItems: "center" }}
    />
  </Flex>
);

export default function EarnRewards({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { account } = useAccountScreen(route);
  const isDelegated = !!account && isAccountDelegating(account);

  const onStartEarning = useCallback(() => {
    if (isDelegated) {
      // Staking entry — wired up when the Tezos stake flow lands (separate story).
      return;
    }
    navigation.navigate(ScreenName.DelegationSummary, { ...route.params });
  }, [isDelegated, navigation, route.params]);

  const learnMore = useCallback(() => {
    Linking.openURL(urls.delegation);
  }, []);

  return (
    <ScrollView>
      <Flex flex={1} justifyContent="space-between" backgroundColor="background.main">
        <Flex m={6}>
          <TrackScreen
            category="DelegationFlow"
            name="Earn Rewards"
            flow="stake"
            action="delegation"
            currency="xtz"
          />
          <Flex flexDirection="row" alignItems="center" justifyContent="center" mb={6}>
            <StepPill label={t("tezos.earnRewards.steps.delegate")} active={!isDelegated} />
            <Flex mx={3}>
              <IconsLegacy.ArrowRightMedium size={16} color="neutral.c70" />
            </Flex>
            <StepPill label={t("tezos.earnRewards.steps.stake")} active={isDelegated} />
          </Flex>

          <StepCard
            accent="neutral.c70"
            label={t("tezos.earnRewards.delegation.step")}
            title={t("tezos.earnRewards.delegation.title")}
            subtitle={t("tezos.earnRewards.delegation.subtitle")}
            bullets={[
              t("tezos.earnRewards.delegation.bullets.0"),
              t("tezos.earnRewards.delegation.bullets.1"),
              t("tezos.earnRewards.delegation.bullets.2"),
            ]}
          />
          <StepCard
            accent="primary.c80"
            label={t("tezos.earnRewards.staking.step")}
            title={t("tezos.earnRewards.staking.title")}
            subtitle={t("tezos.earnRewards.staking.subtitle")}
            bullets={[
              t("tezos.earnRewards.staking.bullets.0"),
              t("tezos.earnRewards.staking.bullets.1"),
              t("tezos.earnRewards.staking.bullets.2"),
            ]}
          />

          <Alert
            type="hint"
            onLearnMore={learnMore}
            learnMoreText={t("tezos.earnRewards.learnMore")}
          />
        </Flex>
        <Flex p={6}>
          <Button
            event="TezosEarnRewardsStartBtn"
            onPress={onStartEarning}
            type="main"
            testID="tezos-earn-rewards-start-button"
          >
            <Trans i18nKey="tezos.earnRewards.cta" />
          </Button>
        </Flex>
      </Flex>
    </ScrollView>
  );
}
