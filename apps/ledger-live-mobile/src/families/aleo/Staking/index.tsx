import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import type { AccountLike } from "@ledgerhq/types-live";
import { useAleoStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import { getAleoCurrencyConfigById } from "@ledgerhq/live-common/families/aleo/config";
import { isAleoAccount, isFirstBondPending } from "@ledgerhq/live-common/families/aleo/utils";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import IlluRewards from "~/icons/images/Rewards";
import { urls } from "~/utils/urls";
import { NavigatorName, ScreenName } from "~/const";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import StakingRow from "./StakingRow";
import StatusIcon from "./StatusIcon";
import StakedDrawer from "./StakedDrawer";
import UnstakingDrawer from "./UnstakingDrawer";
import { useUnbondingState } from "./useUnbondingState";
import { getUnbondingStatusLabel, getValidatorLabel } from "./utils";

type OpenDrawer = "staked" | "unstaking" | null;

function Staking({ account }: Readonly<{ account: AleoAccount }>) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const position = useAleoStakingPosition(account);
  const unbonding = useUnbondingState(account, position);
  const [openDrawer, setOpenDrawer] = useState<OpenDrawer>(null);

  const unit = useAccountUnit(account);
  const label = getValidatorLabel(t, position);

  const onCloseDrawer = useCallback(() => setOpenDrawer(null), []);
  const onOpenStaked = useCallback(() => setOpenDrawer("staked"), []);
  const onOpenUnstaking = useCallback(() => setOpenDrawer("unstaking"), []);

  const onStake = useCallback(() => {
    navigation.navigate(NavigatorName.AleoBondPublicFlow, {
      screen: ScreenName.AleoBondPublicSelectValidator,
      params: { accountId: account.id },
    });
  }, [navigation, account.id]);

  const onBond = useCallback(() => {
    setOpenDrawer(null);
    onStake();
  }, [onStake]);

  if (!position.hasBonded && !position.hasUnbonding) {
    const hasFirstBondPending = isFirstBondPending(account);

    return (
      <Flex mx={6} testID="aleo-staking-empty-state">
        <AccountDelegationInfo
          title={t("aleo.stake.sectionTitle")}
          description={t("aleo.stake.emptyState.description", { name: account.currency.name })}
          image={<IlluRewards style={styles.illustration} />}
          infoUrl={urls.stakingRewards}
          infoTitle={t("aleo.stake.sectionTitle")}
          disabled={hasFirstBondPending}
          onPress={onStake}
          ctaTitle={t("aleo.stake.emptyState.cta")}
        />
        {hasFirstBondPending && (
          <Text
            testID="aleo-staking-bond-pending"
            variant="small"
            color="neutral.c70"
            textAlign="center"
            mt={3}
          >
            {t("aleo.stake.emptyState.bondPending")}
          </Text>
        )}
      </Flex>
    );
  }

  return (
    <Flex mx={6}>
      {position.hasBonded && (
        <>
          <AccountSectionLabel name={t("aleo.stake.sectionTitle")} />
          <StakingRow
            label={label}
            loading={position.validatorsLoading}
            amount={
              <CurrencyUnitValue
                unit={unit}
                value={position.bondedBalance}
                showCode
                disableRounding
              />
            }
            subtitle={
              <CounterValue
                currency={account.currency}
                value={position.bondedBalance}
                withPlaceholder
              />
            }
            statusIcon={
              <Flex mr={2}>
                <StatusIcon
                  nonEarningReason={position.nonEarningReason}
                  loading={position.validatorsLoading}
                  unverified={!!position.validatorsError}
                />
              </Flex>
            }
            event="AleoStakingManage"
            testID="aleo-staked-row"
            onPress={onOpenStaked}
          />
        </>
      )}

      {position.hasUnbonding && (
        <Flex mt={position.hasBonded ? 3 : 0}>
          <AccountSectionLabel name={t("aleo.stake.unstaking")} />
          <StakingRow
            label={unit.name}
            amount={
              <CurrencyUnitValue
                unit={unit}
                value={position.unbondingBalance}
                showCode
                disableRounding
              />
            }
            subtitle={getUnbondingStatusLabel(t, position, unbonding)}
            event="AleoUnstakingDetails"
            testID="aleo-unstaking-row"
            onPress={onOpenUnstaking}
          />
        </Flex>
      )}

      <StakedDrawer
        account={account}
        position={position}
        isOpen={openDrawer === "staked"}
        onClose={onCloseDrawer}
        onBond={onBond}
      />
      <UnstakingDrawer
        account={account}
        position={position}
        unbonding={unbonding}
        isOpen={openDrawer === "unstaking"}
        onClose={onCloseDrawer}
      />
    </Flex>
  );
}

export default function StakingSection({ account }: Readonly<{ account: AccountLike }>) {
  if (!isAleoAccount(account) || account.type !== "Account") return null;
  if (!getAleoCurrencyConfigById(account.currency.id)?.enableStaking) return null;
  return <Staking account={account} />;
}

const styles = StyleSheet.create({
  illustration: {
    alignSelf: "center",
    marginBottom: 16,
  },
});
