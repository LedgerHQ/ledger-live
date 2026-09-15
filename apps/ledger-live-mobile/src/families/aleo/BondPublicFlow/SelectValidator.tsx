import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { Box, Button, Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import { Warning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import { useAleoValidators } from "@ledgerhq/live-common/families/aleo/react";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { isAleoAccount, isValidatorBondable } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoValidator } from "@ledgerhq/live-common/families/aleo/types";
import type { Unit } from "@domain/entity-currency-unit";
import Alert from "~/components/Alert";
import SafeAreaView from "~/components/SafeAreaView";
import { Trans, useTranslation } from "~/context/Locale";
import { useAccountScreen } from "LLM/hooks/useAccountScreen";
import { TrackScreen } from "~/analytics";
import Touchable from "~/components/Touchable";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import { ScreenName } from "~/const";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import type { AleoBondPublicFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<AleoBondPublicFlowParamList, ScreenName.AleoBondPublicSelectValidator>
>;

export default function SelectValidator({ navigation, route }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { account } = useAccountScreen(route);
  const styles = useStyleSheet(
    theme => ({
      root: { flex: 1, backgroundColor: theme.colors.bg.canvas },
      centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: theme.spacings.s24,
      },
      content: {
        flex: 1,
      },
      footer: {
        paddingHorizontal: theme.spacings.s16,
        paddingTop: theme.spacings.s8,
        paddingBottom: theme.spacings.s16,
      },
    }),
    [],
  );

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

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered} testID="aleo-bond-validator-list-loading">
          <Spinner size={32} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && validators.length === 0 && !lockedValidator) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.centered}>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            <Trans i18nKey="aleo.bond.selectValidator.fetchError" />
          </Text>
        </View>
        <View style={styles.footer}>
          <Button appearance="base" size="lg" isFull onPress={onRetry}>
            {t("common.retry")}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <TrackScreen
        category="BondPublicFlow"
        name="SelectValidator"
        flow="stake"
        action="bond"
        currency="aleo"
      />
      {lockedValidator ? (
        <Box lx={{ paddingHorizontal: "s24", paddingVertical: "s12", gap: "s12" }}>
          <Alert type="primary">
            <Trans i18nKey="aleo.bond.selectValidator.lockedHint" />
          </Alert>
          {!!error && !selectedValidator && (
            <Alert type="warning" testID="aleo-bond-validator-metadata-error">
              <Trans i18nKey="aleo.bond.selectValidator.metadataError" />
            </Alert>
          )}
        </Box>
      ) : (
        <SelectValidatorSearchBox searchQuery={search} setSearchQuery={setSearch} />
      )}
      {missingLockedAddress ? (
        <View style={styles.content}>
          <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s12" }}>
            <Text typography="body2SemiBold" lx={{ color: "base" }}>
              {shortAddressPreview(missingLockedAddress)}
            </Text>
          </Box>
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
          appearance="base"
          size="lg"
          isFull
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
  const styles = useStyleSheet(
    theme => ({
      row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: theme.spacings.s16,
        paddingVertical: theme.spacings.s12,
        borderBottomWidth: theme.borderWidth.s1,
        borderBottomColor: theme.colors.border.mutedSubtle,
      },
      rowSelected: { backgroundColor: theme.colors.bg.activeSubtle },
      rowDisabled: { opacity: 0.5 },
      info: { flex: 1 },
      subtitle: {
        flexDirection: "row",
        alignItems: "center",
      },
      warningIcon: { marginRight: theme.spacings.s4 },
      stats: { alignItems: "flex-end" },
    }),
    [],
  );
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
        style={[styles.row, isSelected && styles.rowSelected, isDisabled && styles.rowDisabled]}
      >
        <View style={styles.info}>
          <Text typography="body2SemiBold" lx={{ color: "base" }} numberOfLines={1}>
            {validator.name || shortAddressPreview(validator.address)}
          </Text>
          {!!validator.name && (
            <Text typography="body3" lx={{ color: "muted" }} numberOfLines={1}>
              {shortAddressPreview(validator.address)}
            </Text>
          )}
          <View style={styles.subtitle}>
            {subtitle.warning && <Warning size={12} color="warning" style={styles.warningIcon} />}
            <Text typography="body3" lx={{ color: subtitle.warning ? "warning" : "muted" }}>
              {subtitle.text}
            </Text>
          </View>
        </View>
        <View style={styles.stats}>
          <Text typography="body3SemiBold" lx={{ color: "base" }} numberOfLines={1}>
            <CurrencyUnitValue unit={unit} value={new BigNumber(stakeMicrocredits)} showCode />
          </Text>
          <Text typography="body3" lx={{ color: "muted" }}>
            {t("aleo.bond.selectValidator.totalStake")}
          </Text>
        </View>
      </View>
    </Touchable>
  );
}
