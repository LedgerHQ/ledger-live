import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { useTheme } from "styled-components/native";
import { Box, Button, IconsLegacy, SearchInput, Text } from "@ledgerhq/native-ui";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { isAleoAccount, isValidatorBondable } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import type { Unit } from "@domain/entity-currency-unit";
import Alert from "~/components/Alert";
import InfiniteLoader from "~/components/InfiniteLoader";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans, useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { TrackScreen } from "~/analytics";
import Touchable from "~/components/Touchable";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { AleoBondPublicFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoBondPublicFlowParamList, ScreenName.AleoBondPublicSelectValidator>
>;

export default function SelectValidator({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const { account } = useAccountScreen(route);

  invariant(
    account && isAleoAccount(account) && account.type === "Account",
    "aleo account required",
  );

  const unit = account.currency.units[0];
  const lockedValidator = account.aleoResources?.bondedValidator ?? null;
  const defaultValidator = getAleoCurrencyConfigById(account.currency.id)?.defaultValidator;

  const [selected, setSelected] = useState<string>(
    lockedValidator ?? route.params.validatorAddress ?? defaultValidator ?? "",
  );
  // The lock can appear mid-screen when the account syncs a freshly confirmed bond, so it
  // always wins over the state seeded when the screen mounted.
  const selectedAddress = lockedValidator ?? selected;

  const { validators, loading, error } = useAleoValidators(account.currency);

  useEffect(() => {
    if (lockedValidator) return;
    const current = validators.find(validator => validator.address === selected);
    if (!current || isValidatorBondable(current)) return;

    const replacement = validators.find(validator => isValidatorBondable(validator));
    if (replacement) setSelected(replacement.address);
  }, [validators, selected, lockedValidator]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    const list = lockedValidator
      ? validators.filter(validator => validator.address === lockedValidator)
      : validators;
    if (!query) return list;
    return list.filter(
      validator =>
        validator.name?.toLowerCase().includes(query) ||
        validator.address.toLowerCase().includes(query),
    );
  }, [validators, lockedValidator, search]);

  const onSelect = useCallback(
    (validator: AleoValidator) => {
      if (lockedValidator) return;
      setSelected(validator.address);
    },
    [lockedValidator],
  );

  const selectedValidator = validators.find(validator => validator.address === selectedAddress);
  const missingLockedAddress = lockedValidator && !selectedValidator ? lockedValidator : null;
  const canContinue = selectedValidator
    ? isValidatorBondable(selectedValidator)
    : !!missingLockedAddress;

  const onContinue = useCallback(() => {
    navigation.navigate(ScreenName.AleoBondPublicAmount, {
      accountId: route.params.accountId,
      parentId: route.params.parentId,
      validatorAddress: selectedAddress,
      source: route.params.source,
    });
  }, [navigation, route.params, selectedAddress]);

  // Remounting re-runs the fetch, which drops its cached rejection.
  const onRetry = useCallback(
    () => navigation.replace(ScreenName.AleoBondPublicSelectValidator, route.params),
    [navigation, route.params],
  );

  const rootStyle = [styles.root, { backgroundColor: colors.background.main }];

  if (loading) {
    return (
      <SafeAreaView style={rootStyle}>
        <View style={styles.centered} testID="aleo-bond-validator-list-loading">
          <InfiniteLoader size={32} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && validators.length === 0 && !lockedValidator) {
    return (
      <SafeAreaView style={rootStyle}>
        <View style={styles.centered}>
          <Text variant="body" color="neutral.c70" textAlign="center">
            <Trans i18nKey="aleo.bond.selectValidator.fetchError" />
          </Text>
        </View>
        <View style={styles.footer}>
          <Button type="main" size="large" onPress={onRetry}>
            {t("common.retry")}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={rootStyle}>
      <TrackScreen
        category="BondPublicFlow"
        name="SelectValidator"
        flow="stake"
        action="bond"
        currency="aleo"
      />
      {lockedValidator ? (
        <View style={styles.hints}>
          <Alert type="primary">
            <Trans i18nKey="aleo.bond.selectValidator.lockedHint" />
          </Alert>
          {!!error && !selectedValidator && (
            <Alert type="warning" testID="aleo-bond-validator-metadata-error">
              <Trans i18nKey="aleo.bond.selectValidator.metadataError" />
            </Alert>
          )}
        </View>
      ) : (
        <Box mx={6} mt={3} mb={4}>
          <SearchInput
            returnKeyType="search"
            maxLength={50}
            onChange={setSearch}
            placeholder={t("common.search")}
            value={search}
            numberOfLines={1}
            testID="delegation-search-pool-input"
          />
        </Box>
      )}
      {missingLockedAddress ? (
        <View style={styles.content}>
          <View style={styles.missingLocked}>
            <Text variant="body" fontWeight="semiBold" color="neutral.c100">
              {shortAddressPreview(missingLockedAddress)}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          style={styles.content}
          data={filtered}
          keyExtractor={validator => validator.address}
          renderItem={({ item }) => (
            <ValidatorRow
              validator={item}
              unit={unit}
              isSelected={selectedAddress === item.address}
              isLocked={!!lockedValidator}
              onPress={onSelect}
            />
          )}
        />
      )}
      <View style={styles.footer}>
        <Button
          type="main"
          size="large"
          onPress={onContinue}
          disabled={!canContinue}
          testID="aleo-bond-select-validator-continue"
        >
          {t("common.continue")}
        </Button>
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
}: Readonly<{
  validator: AleoValidator;
  unit: Unit;
  isSelected: boolean;
  isLocked: boolean;
  onPress: (validator: AleoValidator) => void;
}>) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isOpen, isUnbonding, nonEarningReason, commissionPercent, stakeMicrocredits } = validator;
  const isDisabled = isLocked || !isValidatorBondable(validator);

  const handlePress = useCallback(() => onPress(validator), [onPress, validator]);

  const subtitle = useMemo(() => {
    if (isUnbonding) return { warning: true, text: t("aleo.bond.selectValidator.unbonding") };
    if (!isOpen) return { warning: true, text: t("aleo.bond.selectValidator.closed") };
    if (nonEarningReason) {
      return {
        warning: true,
        text: t("aleo.bond.selectValidator.earnsNothing"),
      };
    }
    if (validator.estimatedYearlyRewardsRate !== undefined) {
      return {
        warning: false,
        text: t("aleo.bond.selectValidator.rateAndCommission", {
          rate: (validator.estimatedYearlyRewardsRate * 100).toFixed(1),
          commission: commissionPercent,
        }),
      };
    }
    return {
      warning: false,
      text: t("aleo.bond.selectValidator.commissionOnly", {
        commission: commissionPercent,
      }),
    };
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
      onPress={isDisabled ? undefined : handlePress}
      disabled={isDisabled}
    >
      <View
        style={[
          styles.row,
          { borderBottomColor: colors.neutral.c30 },
          isSelected && { backgroundColor: colors.primary.c20 },
          isDisabled && styles.rowDisabled,
        ]}
      >
        <View style={styles.info}>
          <Text variant="body" fontWeight="semiBold" color="neutral.c100" numberOfLines={1}>
            {validator.name || shortAddressPreview(validator.address)}
          </Text>
          {!!validator.name && (
            <Text variant="small" color="neutral.c70" numberOfLines={1}>
              {shortAddressPreview(validator.address)}
            </Text>
          )}
          <View style={styles.subtitle}>
            {subtitle.warning && (
              <IconsLegacy.WarningMedium size={12} color="warning.c70" style={styles.warningIcon} />
            )}
            <Text variant="small" color={subtitle.warning ? "warning.c70" : "neutral.c70"}>
              {subtitle.text}
            </Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Text variant="small" fontWeight="semiBold" color="neutral.c100" numberOfLines={1}>
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
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
  },
  hints: {
    marginHorizontal: 24,
    marginVertical: 12,
    gap: 12,
  },
  missingLocked: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
  },
  subtitle: {
    flexDirection: "row",
    alignItems: "center",
  },
  warningIcon: {
    marginRight: 4,
  },
  stats: {
    alignItems: "flex-end",
  },
});
