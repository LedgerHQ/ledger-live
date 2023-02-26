import React, { useCallback, useState, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import {
  getAccountUnit,
  getAccountCurrency,
} from "@ledgerhq/live-common/account/helpers";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Box, Button, Icons, Text } from "@ledgerhq/native-ui";
import { urls } from "../../../config/urls";
import Row from "./Row";
import Header from "./Header";
import LText from "../../../components/LText";
import { NavigatorName, ScreenName } from "../../../const";
import ArrowRight from "../../../icons/ArrowRight";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import IlluRewards from "../../../icons/images/Rewards";
import ProgressCircle from "../../../components/ProgressCircle";
import InfoModal from "../../../modals/Info";
import ClaimRewards from "../../../icons/ClaimReward";
import AccountDelegationInfo from "../../../components/AccountDelegationInfo";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import { IconAccount } from "@ledgerhq/live-common/families/icon/types";
import { useIconPublicRepresentatives, formatVotes } from "@ledgerhq/live-common/families/icon/react";
import { StackNavigationProp } from "@react-navigation/stack";

const MIN_TRANSACTION_AMOUNT = 1;
type Props = {
  account: IconAccount;
};

const Delegation = ({ account }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [infoRewardsModal, setRewardsInfoModal] = useState<boolean>();

  const publicRepresentatives = useIconPublicRepresentatives(account.currency);

  const infoRewardsModalData = useMemo(
    () => [
      {
        Icon: () => <ClaimRewards size={18} color={colors.darkBlue} />,
        title: <Trans i18nKey="icon.info.claimRewards.title" />,
        description: <Trans i18nKey="icon.info.claimRewards.description" />,
      },
    ],
    [colors.darkBlue],
  );


  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const explorerView = getDefaultExplorerView(account.currency);
  const accountId = account.id;

  const { spendableBalance, iconResources } = account;

  const canFreeze =
    spendableBalance && spendableBalance.gt(MIN_TRANSACTION_AMOUNT);

  const { votes, votingPower, unwithdrawnReward } = iconResources || {};

  const formattedUnwidthDrawnReward = BigNumber(unwithdrawnReward || 0);

  const formattedVotes = formatVotes(votes, publicRepresentatives);

  const totalVotesUsed = votes.reduce(
    (sum, { value }) => sum + Number(value),
    0,
  );

  const openRewardsInfoModal = useCallback(
    () => setRewardsInfoModal(true),
    [setRewardsInfoModal],
  );

  const closeRewardsInfoModal = useCallback(
    () => setRewardsInfoModal(false),
    [setRewardsInfoModal],
  );

  const bridge = getAccountBridge(account, undefined);

  const { transaction, status } = useBridgeTransaction(() => {
    const t = bridge.createTransaction(account);

    const transaction = bridge.updateTransaction(t, {
      mode: "claimReward",
    });

    return { account, transaction };
  });

  const claimRewards = useCallback(() => {
    navigation.navigate(NavigatorName.ClaimRewards, {
      screen: ScreenName.ClaimRewardsSelectDevice,
      params: {
        accountId,
        transaction,
        status,
      },
    });
  }, [accountId, navigation, transaction, status]);


  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: string;
      screen?: string;
      params?: { [key: string]: unknown; };
    }) => {
      // This is complicated (even impossible?) to type properly…
      (navigation as StackNavigationProp<{ [key: string]: object; }>).navigate(
        route,
        {
          screen,
          params: { ...params, accountId: account.id },
        },
      );
    },
    [navigation, account.id],
  );

  const onDelegateFreeze = useCallback(() => {
    onNavigate({
      route: NavigatorName.IconFreezeFlow,
      screen: ScreenName.IconFreezeInfo,
      params: {
        accountId,
      },
    });
  }, [accountId, navigation]);


  const onDelegate = useCallback(() => {
    const screenName = votes.length > 0
      ? ScreenName.IconVoteSelectValidator
      : ScreenName.IconVoteStarted;

    onNavigate({
      route: NavigatorName.IconVoteFlow,
      screen: screenName,
      params: {
        accountId,
      },
    });
  }, [navigation, accountId]);

  const hasRewards = BigNumber(unwithdrawnReward).gt(0);


  const canClaimRewards = hasRewards;

  const percentVotesUsed = totalVotesUsed / (totalVotesUsed + Number(votingPower));

  if (!hasRewards && (!votingPower || !formattedVotes.length) && !canFreeze) {
    return null;
  }

  return (
    <View style={styles.root}>
      {(hasRewards || (Number(votingPower) > 0 && formattedVotes.length > 0)) && (
        <>
          <AccountSectionLabel
            name={t("icon.voting.rewards.title")}
            Icon={Icons.InfoMedium}
            onPress={openRewardsInfoModal}
          />
          <View style={[styles.rewardSection]}>
            <View style={styles.labelSection}>
              <Text fontWeight={"semiBold"} variant={"h4"}>
                <CurrencyUnitValue
                  unit={unit}
                  value={formattedUnwidthDrawnReward}
                />
              </Text>
              <Text
                variant={"body"}
                fontWeight={"semiBold"}
                color="neutral.c80"
              >
                {currency && (
                  <CounterValue
                    currency={currency}
                    value={formattedUnwidthDrawnReward}
                  />
                )}
              </Text>
            </View>
            <Button
              type="main"
              disabled={!canClaimRewards}
              onPress={claimRewards}
            >
              <Trans i18nKey="icon.voting.rewards.button" />
            </Button>
          </View>
        </>
      )}
      {(
        formattedVotes.length > 0 ? (
          <>
            <Header count={formattedVotes.length} onPress={onDelegate} />
            <View style={[styles.container, styles.noPadding]}>
              <Box mb={5}>
                {formattedVotes.map(
                  ({ validator, address, value, isPR }, index) => (
                    <Row
                      key={index}
                      validator={validator}
                      address={address}
                      amount={Number(value)}
                      explorerView={explorerView ?? undefined}
                      isSR={isPR}
                      isLast={index === formattedVotes.length - 1}
                    />
                  ),
                )}
              </Box>
              {percentVotesUsed < 1 && (
                <View style={{ marginBottom: 24 }}>
                  <TouchableOpacity
                    onPress={onDelegate}
                    style={[styles.warn, { backgroundColor: colors.lightLive }]}
                  >
                    <ProgressCircle
                      size={60}
                      progress={percentVotesUsed}
                      backgroundColor={colors.fog}
                    />
                    <View style={styles.warnSection}>
                      <LText
                        semiBold
                        style={[styles.warnText, styles.warnTitle]}
                      >
                        <Trans i18nKey="icon.voting.remainingVotes.title" />
                      </LText>
                      <LText style={styles.warnText} color="live">
                        <Trans i18nKey="icon.voting.remainingVotes.description" />
                      </LText>
                    </View>

                    <ArrowRight size={16} color={colors.live} />
                  </TouchableOpacity>

                </View>
              )}
            </View>
          </>
        ) : (

          Number(votingPower) <= 0 ? (
            <AccountDelegationInfo
              title={t("account.delegation.info.title")}
              image={<IlluRewards style={styles.illustration} />}
              description={t("icon.voting.delegationEarn", {
                name: account.currency.name,
              })}
              infoUrl={urls.tronStaking}
              infoTitle={t("icon.voting.howItWorks")}
              disabled={!canFreeze}
              onPress={onDelegateFreeze}
              ctaTitle={t("account.delegation.info.cta")}
            />
          ) : (
            <>
              <AccountSectionLabel name={t("icon.voting.votes.title")} />
              <Box my={6}>
                <AccountDelegationInfo
                  description={t("icon.voting.votes.description", {
                    name: account.currency.name,
                  })}
                  infoUrl={urls.tronStaking}
                  infoTitle={t("icon.voting.howItWorks")}
                  onPress={() => { }}
                  ctaTitle={t("icon.voting.votes.cta")}
                />
              </Box>
            </>
          )

        )
      )

      }

      <InfoModal
        isOpened={!!infoRewardsModal}
        onClose={closeRewardsInfoModal}
        data={infoRewardsModalData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
  },
  container: {
    padding: 16,
    borderRadius: 4,
    flexDirection: "column",
    alignItems: "stretch",
  },
  noPadding: {
    padding: 0,
  },
  rewardSection: {
    paddingVertical: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  collectButton: {
    flexBasis: "auto",
    flexGrow: 0.5,
  },
  labelSection: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  warn: {
    flexDirection: "row",
    padding: 8,

    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  warnSection: {
    flexDirection: "column",
    flex: 1,
    marginHorizontal: 6,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  warnTitle: {
    fontSize: 14,
  },
  warnText: {
    marginLeft: 0,
    fontSize: 13,
  },
  cta: {
    flex: 1,
    flexGrow: 0.5,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
    paddingVertical: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 18,
    textAlign: "left",
  },
});

export default function Votes({
  account,
}: { account: AccountLike; } & Omit<Props, "account">) {
  if (!account || !(account as IconAccount).iconResources) return null;

  return (
    <Delegation
      account={account as IconAccount}
    />
  );
}

