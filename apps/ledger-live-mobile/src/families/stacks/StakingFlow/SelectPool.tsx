import React, { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";
import { BaseInput, Button, Text } from "@ledgerhq/native-ui";
import {
  isPoolAddress,
  isValidNumCycles,
  MAX_NUM_CYCLES,
  MIN_NUM_CYCLES,
  parseNumCycles,
} from "@ledgerhq/coin-stacks/common-logic/staking";
import SafeAreaView from "~/components/SafeAreaView";
import KeyboardView from "~/components/KeyboardView";
import { Trans, useTranslation } from "~/context/Locale";
import { TrackScreen } from "@shared/analytics-react";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { stacksFlowStyles as styles } from "../shared/styles";
import type { StacksStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<StacksStakingFlowParamList, ScreenName.StacksStakingPool>
>;

export default function SelectPool({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [valAddress, setValAddress] = useState(route.params.valAddress ?? "");
  // The typed text is kept as-is, so an invalid entry stays visible next to its error.
  const [numCyclesInput, setNumCyclesInput] = useState(
    String(route.params.numCycles ?? MIN_NUM_CYCLES),
  );
  const numCycles = parseNumCycles(numCyclesInput);

  const onChangeValAddress = useCallback((value: string) => setValAddress(value.trim()), []);

  const isPoolValid = isPoolAddress(valAddress);
  const isNumCyclesValid = isValidNumCycles(numCycles);
  const showPoolError = !!valAddress && !isPoolValid;
  const showNumCyclesError = !isNumCyclesValid;

  const onContinue = useCallback(() => {
    if (!isPoolValid || numCycles === undefined) return;
    navigation.navigate(ScreenName.StacksStakingAmount, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      valAddress,
      numCycles,
      source: route.params.source,
    });
  }, [isPoolValid, navigation, numCycles, route.params, valAddress]);

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <TrackScreen
        category="StacksStakingFlow"
        name="SelectPool"
        flow="stake"
        action="delegate"
        currency="stx"
      />
      <KeyboardView style={styles.root}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text variant="body" color="neutral.c70" mb={6}>
            <Trans i18nKey="stacks.stake.pool.description" />
          </Text>
          <View style={styles.field}>
            <Text variant="small" fontWeight="semiBold" color="neutral.c70" mb={2}>
              <Trans i18nKey="stacks.stake.pool.poolAddressLabel" />
            </Text>
            <BaseInput
              value={valAddress}
              onChange={onChangeValAddress}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="SP…native-pool-signer-manager"
              // The visible label is a separate Text, which screen readers don't tie to the input.
              accessibilityLabel={t("stacks.stake.pool.poolAddressLabel")}
              error={showPoolError ? t("stacks.stake.pool.poolAddressError") : undefined}
              testID="stacks-stake-pool-address-input"
            />
          </View>
          <View style={styles.field}>
            <Text variant="small" fontWeight="semiBold" color="neutral.c70" mb={2}>
              <Trans i18nKey="stacks.stake.pool.numCyclesLabel" />
            </Text>
            <BaseInput
              value={numCyclesInput}
              onChange={setNumCyclesInput}
              keyboardType="number-pad"
              accessibilityLabel={t("stacks.stake.pool.numCyclesLabel")}
              placeholder={String(MIN_NUM_CYCLES)}
              error={
                showNumCyclesError
                  ? t("stacks.stake.pool.numCyclesError", {
                      min: MIN_NUM_CYCLES,
                      max: MAX_NUM_CYCLES,
                    })
                  : undefined
              }
              testID="stacks-stake-num-cycles-input"
            />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button
            type="main"
            size="large"
            onPress={onContinue}
            disabled={!isPoolValid || !isNumCyclesValid}
            testID="stacks-stake-pool-continue"
          >
            {t("common.continue")}
          </Button>
        </View>
      </KeyboardView>
    </SafeAreaView>
  );
}
