import React, { useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "react-i18next";
import { BigNumber } from "bignumber.js";
import { getAccountUnit, getAccountCurrency } from "@ledgerhq/live-common/account/helpers";
import {
  useTronSuperRepresentatives,
  formatVotes,
  getLastVotedDate,
  MIN_TRANSACTION_AMOUNT,
} from "@ledgerhq/live-common/families/tron/react";
import { getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import { Account, AccountLike } from "@ledgerhq/types-live";
import { Box, Button, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { TronAccount } from "@ledgerhq/live-common/families/tron/types";
import { urls } from "~/utils/urls";
import Row from "./Row";
import Header from "./Header";
import LText from "~/components/LText";
import ArrowRight from "~/icons/ArrowRight";
import DateFromNow from "~/components/DateFromNow";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import IlluRewards from "~/icons/images/Rewards";
import ProgressCircle from "~/components/ProgressCircle";
import AccountDelegationInfo from "~/components/AccountDelegationInfo";
import AccountSectionLabel from "~/components/AccountSectionLabel";

type Props = {
  account: TronAccount;
  parentAccount?: Account;
};

const Delegation = ({ account }: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const superRepresentatives = useTronSuperRepresentatives();
  const lastVotedDate = useMemo(() => getLastVotedDate(account), [account]);

  const lastDate = lastVotedDate ? <DateFromNow date={lastVotedDate.valueOf()} /> : null;

  const currency = getAccountCurrency(account);
  const unit = getAccountUnit(account);
  const explorerView = getDefaultExplorerView(account.currency);

  const { spendableBalance, tronResources } = account;

  const canFreeze = spendableBalance && spendableBalance.gt(MIN_TRANSACTION_AMOUNT);

  const { votes, tronPower, unwithdrawnReward } = tronResources || {};

  const formattedUnwidthDrawnReward = BigNumber(unwithdrawnReward || 0);

  const formattedVotes = formatVotes(votes, superRepresentatives);

  const totalVotesUsed = votes.reduce((sum, { voteCount }) => sum + voteCount, 0);
  const hasRewards = BigNumber(unwithdrawnReward).gt(0);
  const percentVotesUsed = totalVotesUsed / tronPower;

  if (!hasRewards && (!tronPower || !formattedVotes.length) && !canFreeze) {
    return null;
  }

  return (
    <View style={styles.root}>
      {(hasRewards || (tronPower > 0 && formattedVotes.length > 0)) && (
        <>
          <AccountSectionLabel
            name={t("tron.voting.rewards.title")}
            Icon={IconsLegacy.InfoMedium}
          />
          <View style={[styles.rewardSection]}>
            <View style={styles.labelSection}>
              <Text fontWeight={"semiBold"} variant={"h4"}>
                <CurrencyUnitValue unit={unit} value={formattedUnwidthDrawnReward} />
              </Text>
              <Text variant={"body"} fontWeight={"semiBold"} color="neutral.c80">
                {currency && (
                  <CounterValue currency={currency} value={formattedUnwidthDrawnReward} />
                )}
              </Text>
            </View>
            <Button type="main" disabled={true}>
              <Trans i18nKey="tron.voting.rewards.button" />
            </Button>
          </View>
        </>
      )}
      {tronPower > 0 ? (
        formattedVotes.length > 0 ? (
          <>
            <Header count={formattedVotes.length} onPress={() => undefined} />
            <View style={[styles.container, styles.noPadding]}>
              <Box mb={5}>
                {formattedVotes.map(({ validator, address, voteCount, isSR }, index) => (
                  <Row
                    key={index}
                    validator={validator}
                    address={address}
                    amount={voteCount}
                    duration={lastDate}
                    explorerView={explorerView ?? undefined}
                    isSR={isSR}
                    isLast={index === formattedVotes.length - 1}
                  />
                ))}
              </Box>
              {percentVotesUsed < 1 && (
                <View style={{ marginBottom: 24 }}>
                  <TouchableOpacity
                    disabled={true}
                    style={[styles.warn, { backgroundColor: colors.lightLive }]}
                  >
                    <ProgressCircle
                      size={60}
                      progress={percentVotesUsed}
                      backgroundColor={colors.fog}
                    />
                    <View style={styles.warnSection}>
                      <LText semiBold style={[styles.warnText, styles.warnTitle]}>
                        <Trans i18nKey="tron.voting.remainingVotes.title" />
                      </LText>
                      <LText style={styles.warnText} color="live">
                        <Trans i18nKey="tron.voting.remainingVotes.description" />
                      </LText>
                    </View>

                    <ArrowRight size={16} color={colors.live} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : (
          <>
            <AccountSectionLabel name={t("tron.voting.votes.title")} />
            <Box my={6}>
              <AccountDelegationInfo
                description={t("tron.voting.votes.description", {
                  name: account.currency.name,
                })}
                infoUrl={urls.tronStaking}
                infoTitle={t("tron.voting.howItWorks")}
                disabled={true}
                onPress={() => undefined}
                ctaTitle={t("tron.voting.votes.cta")}
              />
            </Box>
          </>
        )
      ) : (
        canFreeze && (
          <AccountDelegationInfo
            title={t("account.delegation.info.title")}
            image={<IlluRewards style={styles.illustration} />}
            description={t("tron.voting.delegationEarn", {
              name: account.currency.name,
            })}
            infoUrl={urls.tronStaking}
            infoTitle={t("tron.voting.howItWorks")}
            disabled={true}
            onPress={() => undefined}
            ctaTitle={t("account.delegation.info.cta")}
          />
        )
      )}
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
  parentAccount,
}: { account: AccountLike } & Omit<Props, "account">) {
  if (!account || !(account as TronAccount).tronResources) return null;

  return <Delegation account={account as TronAccount} parentAccount={parentAccount} />;
}
