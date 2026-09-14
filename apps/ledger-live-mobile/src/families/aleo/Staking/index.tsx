import React, { useCallback, useState } from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import type { AccountLike } from "@ledgerhq/types-live";
import { useStakingPosition } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
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
import { getUnbondingStatusLabel } from "./unbondingStatusLabel";
import { isStakingEnabled } from "./isStakingEnabled";

type OpenDrawer = "staked" | "unstaking" | null;

function Staking({ account }: { account: AleoAccount }) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<BaseNavigatorStackParamList>>();
  const position = useStakingPosition(account);
  const unbonding = useUnbondingState(account, position);
  const [openDrawer, setOpenDrawer] = useState<OpenDrawer>(null);

  const unit = account.currency.units[0];
  const label = position.validatorLabel || t("aleo.stake.unknownValidator");
  // A fully unbonded position keeps no validator on chain, so the unstaking row has none to name.
  const unstakingLabel = position.validatorLabel || t("aleo.stake.unstakingRow.title");

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
    return (
      <Flex mx={6} testID="aleo-staking-empty-state">
        <AccountDelegationInfo
          title={t("aleo.stake.sectionTitle")}
          description={t("aleo.stake.emptyState.description", { name: account.currency.name })}
          image={<IlluRewards />}
          infoUrl={urls.stakingRewards}
          infoTitle={t("aleo.stake.sectionTitle")}
          onPress={onStake}
          ctaTitle={t("aleo.stake.emptyState.cta")}
        />
      </Flex>
    );
  }

  return (
    <Flex mx={6} testID="aleo-staking-section">
      {position.hasBonded && (
        <>
          <AccountSectionLabel name={t("aleo.stake.sectionTitle")} />
          <StakingRow
            label={label}
            amount={<CurrencyUnitValue unit={unit} value={position.bondedBalance} showCode />}
            sub={
              <CounterValue
                currency={account.currency}
                value={position.bondedBalance}
                withPlaceholder
              />
            }
            statusIcon={
              <Flex mr={2}>
                <StatusIcon nonEarningReason={position.nonEarningReason} />
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
          <AccountSectionLabel name={t("aleo.stake.unstakingSectionTitle")} />
          <StakingRow
            label={unstakingLabel}
            amount={<CurrencyUnitValue unit={unit} value={position.unbondingBalance} showCode />}
            sub={getUnbondingStatusLabel(t, position, unbonding)}
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

export default function StakingSection({ account }: { account: AccountLike }) {
  if (account.type !== "Account") return null;
  const aleoAccount = account as AleoAccount;
  if (!isStakingEnabled(aleoAccount)) return null;
  return <Staking account={aleoAccount} />;
}
