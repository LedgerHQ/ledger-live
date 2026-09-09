import React, { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import BigNumber from "bignumber.js";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans, useTranslation } from "~/context/Locale";
import { useTheme } from "@react-navigation/native";
import { IconsLegacy, Text } from "@ledgerhq/native-ui";
import { Spinner } from "@ledgerhq/lumen-ui-rnative";
import invariant from "invariant";
import type { Unit } from "@domain/entity-currency-unit";
import { useSelector } from "~/context/hooks";
import { accountScreenSelector } from "~/reducers/accounts";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import { DEFAULT_ALEO_VALIDATOR } from "@ledgerhq/live-common/families/aleo/constants";
import type {
  AleoValidator,
  AleoAccount,
  AleoCoinConfig,
} from "@ledgerhq/live-common/families/aleo/types";
import { isAleoAccount } from "@ledgerhq/live-common/families/aleo/utils";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import Touchable from "~/components/Touchable";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import type { BondPublicFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<BondPublicFlowParamList, ScreenName.AleoBondPublicSelectValidator>
>;

export default function SelectValidator({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [, forceRetry] = useState(0);
  const { account } = useSelector(accountScreenSelector(route));

  invariant(
    account && isAleoAccount(account) && account.type === "Account",
    "aleo account required",
  );

  const aleoAccount = account as AleoAccount;
  const unit = aleoAccount.currency.units[0];
  const lockedValidator = aleoAccount.aleoResources?.bondedValidator ?? null;

  let defaultValidator = "";
  try {
    const config = getCurrencyConfiguration<AleoCoinConfig>(aleoAccount.currency.id);
    const networkType = config?.networkType as "mainnet" | "testnet" | undefined;
    if (networkType) defaultValidator = DEFAULT_ALEO_VALIDATOR[networkType];
  } catch {
    // no config → no pre-selection
  }

  const [selected, setSelected] = useState<string>(
    lockedValidator ?? route.params.validatorAddress ?? defaultValidator,
  );

  const { validators, loading, error } = useAleoValidators(aleoAccount.currency);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = lockedValidator
      ? validators.filter(v => v.address === lockedValidator)
      : validators;
    if (!q) return list;
    return list.filter(
      v => v.name?.toLowerCase().includes(q) || v.address.toLowerCase().includes(q),
    );
  }, [validators, lockedValidator, search]);

  const onSelect = useCallback(
    (validator: AleoValidator) => {
      if (lockedValidator) return;
      setSelected(validator.address);
    },
    [lockedValidator],
  );

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.AleoBondPublicAmount, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      validatorAddress: selected,
    });
  }, [navigation, route.params, selected]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Spinner size={32} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" mb={4}>
            <Trans i18nKey="aleo.bond.selectValidator.fetchError" />
          </Text>
          <Button
            type="primary"
            title={t("common.retry")}
            onPress={() => {
              forceRetry(n => n + 1);
              navigation.replace(ScreenName.AleoBondPublicSelectValidator, route.params);
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <TrackScreen category="BondPublicFlow" name="SelectValidator" flow="bond" currency="aleo" />
      {!lockedValidator && (
        <SelectValidatorSearchBox searchQuery={search} setSearchQuery={setSearch} />
      )}
      {lockedValidator && (
        <View style={styles.lockedHintContainer}>
          <Text variant="small" color="neutral.c70">
            <Trans i18nKey="aleo.bond.selectValidator.lockedHint" />
          </Text>
        </View>
      )}
      <FlatList
        data={filtered}
        keyExtractor={item => item.address}
        renderItem={({ item }) => (
          <ValidatorRow
            validator={item}
            unit={unit}
            isSelected={selected === item.address}
            isLocked={!!lockedValidator}
            onPress={onSelect}
          />
        )}
      />
      <View style={styles.footer}>
        <Button
          type="primary"
          title={<Trans i18nKey="common.continue" />}
          onPress={onContinue}
          containerStyle={styles.button}
          disabled={!selected}
          event="AleoBondSelectValidatorContinue"
        />
      </View>
    </SafeAreaView>
  );
}

function ValidatorRow({
  validator,
  unit,
  isSelected,
  isLocked,
  onPress,
}: {
  validator: AleoValidator;
  unit: Unit;
  isSelected: boolean;
  isLocked: boolean;
  onPress: (v: AleoValidator) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isOpen, isUnbonding, nonEarningReason, commissionPercent, stakeMicrocredits } = validator;
  const isDisabled = isLocked || !isOpen || isUnbonding || nonEarningReason === "overConcentrated";

  const handlePress = useCallback(() => {
    if (!isDisabled) onPress(validator);
  }, [isDisabled, onPress, validator]);

  const subtitle = useMemo(() => {
    if (isUnbonding) return { warning: true, text: t("aleo.bond.selectValidator.unbonding") };
    if (!isOpen) return { warning: true, text: t("aleo.bond.selectValidator.closed") };
    if (nonEarningReason === "fullCommission") {
      return { warning: true, text: t("aleo.bond.selectValidator.nonEarning.fullCommission") };
    }
    if (nonEarningReason === "overConcentrated") {
      return { warning: true, text: t("aleo.bond.selectValidator.nonEarning.overConcentrated") };
    }
    const commission = (commissionPercent / 100).toFixed(1);
    if (validator.estimatedYearlyRewardsRate !== undefined) {
      const rate = (validator.estimatedYearlyRewardsRate * 100).toFixed(1);
      return {
        warning: false,
        text: t("aleo.bond.selectValidator.rateAndCommission", { rate, commission }),
      };
    }
    return { warning: false, text: t("aleo.bond.selectValidator.commissionOnly", { commission }) };
  }, [
    isUnbonding,
    isOpen,
    nonEarningReason,
    commissionPercent,
    validator.estimatedYearlyRewardsRate,
    t,
  ]);

  return (
    <Touchable
      event="AleoBondSelectValidator"
      eventProperties={{ validatorAddress: validator.address }}
      onPress={handlePress}
    >
      <View
        style={[
          styles.row,
          { borderBottomColor: colors.lightGrey },
          isSelected && { backgroundColor: colors.card },
          isDisabled && styles.disabled,
        ]}
      >
        <View style={styles.rowInfo}>
          <Text fontWeight="semiBold" numberOfLines={1}>
            {validator.name || validator.address.slice(0, 16) + "…"}
          </Text>
          <View style={styles.subtitleRow}>
            {subtitle.warning && (
              <IconsLegacy.WarningMedium
                size={12}
                color={colors.yellow}
                style={styles.warningIcon}
              />
            )}
            <Text variant="small" color={subtitle.warning ? "warning.c50" : "neutral.c70"}>
              {subtitle.text}
            </Text>
          </View>
        </View>
        <View style={styles.rowStats}>
          <Text variant="small" fontWeight="semiBold" numberOfLines={1}>
            <CurrencyUnitValue unit={unit} value={new BigNumber(stakeMicrocredits)} showCode />
          </Text>
          <Text variant="small" color="neutral.c70">
            {t("aleo.bond.selectValidator.totalStake")}
          </Text>
        </View>
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  lockedHintContainer: { paddingHorizontal: 24, paddingVertical: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowInfo: { flex: 1 },
  subtitleRow: { flexDirection: "row", alignItems: "center" },
  warningIcon: { marginRight: 4 },
  rowStats: { alignItems: "flex-end" },
  disabled: { opacity: 0.5 },
  footer: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  button: { alignSelf: "stretch" },
});
