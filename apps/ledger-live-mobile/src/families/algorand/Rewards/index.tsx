import invariant from "invariant";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { Box, Button, Flex, Text } from "@ledgerhq/native-ui";
import { InfoMedium } from "@ledgerhq/native-ui/assets/icons";
import { AlgorandAccount } from "@ledgerhq/live-common/families/algorand/types";
import type { AccountLike } from "@ledgerhq/types-live";
import AccountSectionLabel from "~/components/AccountSectionLabel";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import { ScreenName, NavigatorName } from "~/const";

type Props = {
  account: AccountLike;
};

const RewardsSection = ({ account }: { account: AlgorandAccount }) => {
  invariant(account && account.algorandResources, "algorand resources required");
  const { rewards } = account.algorandResources;

  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onRewardsInfoClick = useCallback(() => {
    navigation.navigate(NavigatorName.AlgorandClaimRewardsFlow, {
      screen: ScreenName.AlgorandClaimRewardsInfo,
      params: { accountId: account.id },
    });
  }, [navigation, account]);

  const onRewardsClick = useCallback(() => {
    navigation.navigate(NavigatorName.AlgorandClaimRewardsFlow, {
      screen: ScreenName.AlgorandClaimRewardsStarted,
      params: { accountId: account.id },
    });
  }, [account, navigation]);

  const rewardsDisabled = rewards.lte(0);

  return (
    <Box px={6}>
      <AccountSectionLabel
        name={t("algorand.claimRewards.title")}
        Icon={InfoMedium}
        onPress={onRewardsInfoClick}
      />
      <Flex flexDirection={"row"} alignItems={"center"} pt={6}>
        <Flex flexDirection={"column"} flex={1}>
          <Text fontWeight={"semiBold"} variant={"large"}>
            <CurrencyUnitValue unit={unit} value={rewards} />
          </Text>
          <Text fontWeight={"medium"} variant={"body"} color="neutral.c70">
            {currency && <CounterValue currency={currency} value={rewards} />}
          </Text>
        </Flex>
        <Button type="main" disabled={rewardsDisabled} onPress={onRewardsClick}>
          {t("algorand.claimRewards.button")}
        </Button>
      </Flex>
    </Box>
  );
};

const Rewards = ({ account }: Props) => {
  const { algorandResources } = account as AlgorandAccount;

  if (!algorandResources) return null;

  return <RewardsSection account={account as AlgorandAccount} />;
};

export default Rewards;
