import { BigNumber } from "bignumber.js";
import React, { useCallback, useState, useMemo , ElementProps } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { View, StyleSheet, Linking, Text } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { Trans, useTranslation } from "react-i18next";
import {
  getAccountCurrency,
  getAccountUnit,
  getMainAccount,
} from "@ledgerhq/live-common/account/index";
import {
  getDefaultExplorerView,
  getAddressExplorer,
} from "@ledgerhq/live-common/explorers";
import type { Account } from "@ledgerhq/types-live";
import {
  mapUnbondings,
  canRedelegate,
  getRedelegation,
  canUndelegate,
  canDelegate,
} from "@ledgerhq/live-common/families/cosmos/logic";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import Alert from "../../../components/Alert";
import AccountDelegationInfo from "../../../components/AccountDelegationInfo";
import IlluRewards from "../../../icons/images/Rewards";
import { urls } from "../../../config/urls";
import AccountSectionLabel from "../../../components/AccountSectionLabel";
import DelegationDrawer from "../../../components/DelegationDrawer";
import type { IconProps } from "../../../components/DelegationDrawer";
import Touchable from "../../../components/Touchable";
import { rgba } from "../../../colors";
import { ScreenName, NavigatorName } from "../../../const";
import Circle from "../../../components/Circle";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import RedelegateIcon from "../../../icons/Redelegate";
import ClaimRewardIcon from "../../../icons/ClaimReward";
import NominateIcon from "../../../icons/Vote";
import RevokeIcon from "../../../icons/VoteNay";
import DelegationRow from "./Row";
import DelegationLabelRight from "./LabelRight";
import CurrencyUnitValue from "../../../components/CurrencyUnitValue";
import CounterValue from "../../../components/CounterValue";
import DateFromNow from "../../../components/DateFromNow";
import ValidatorImage from "../../cosmos/shared/ValidatorImage";
import { activatableVotes, availablePendingWithdrawals, fallbackValidatorGroup, LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS, revokableVotes, voteStatus } from "@ledgerhq/live-common/families/celo/logic";
import { CeloAccount, CeloValidatorGroup, CeloVote } from "@ledgerhq/live-common/lib/families/celo/types";
import { formatAmount } from "./utils";
import CheckCircle from "../../../icons/CheckCircle";
import Loader from "../../../icons/Loader";

type MappedCeloVote = CeloVote & {
  vGroup: CeloValidatorGroup;
};

type Props = {
  account: Account,
};

type DelegationDrawerProps = ElementProps<typeof DelegationDrawer>;
type DelegationDrawerActions = DelegationDrawerProps["actions"];

function Delegations({ account }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const mainAccount = getMainAccount(account, null);
  const currency = getAccountCurrency(mainAccount);
  const unit = getAccountUnit(mainAccount);
  const navigation = useNavigation();
  const { validatorGroups } = useCeloPreloadData();
  const { celoResources } = mainAccount as CeloAccount;
  const { votes } = celoResources;

  const withdrawEnabled = availablePendingWithdrawals(account as CeloAccount).length;
  const activatingEnabled = activatableVotes(account as CeloAccount).length;
  const [vote, setVote] = useState();

  const onNavigate = useCallback(
    ({
      route,
      screen,
      params,
    }: {
      route: typeof NavigatorName | typeof ScreenName,
      screen?: typeof ScreenName,
      params?: { [key: string]: any },
    }) => {
      setVote();
      navigation.navigate(route, {
        screen,
        params: { ...params, accountId: account.id },
      });
    },
    [navigation, account.id],
  );

  const onActivate = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloLockFlow,
      screen: ScreenName.CeloLockAmount,
      params: {
        accountId: account.id,
      },
    });
  }, [onNavigate, vote, account]);

  const onRevoke = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloLockFlow,
      screen: ScreenName.CeloLockAmount,
      params: {
        accountId: account.id,
      },
    });
  }, [onNavigate, vote, account]);

  const onWithdraw = useCallback(() => {
    onNavigate({
      route: NavigatorName.CeloLockFlow,
      screen: ScreenName.CeloLockAmount,
      params: {
        accountId: account.id,
      },
    });
  }, [onNavigate, vote, account]);

  const onCloseDrawer = useCallback(() => {
    setVote();
  }, []);

  const getValidatorName = useCallback(
    (vote: CeloVote): string => {
      const validatorInfo = validatorGroups.find(validator => validator.address === vote.validatorGroup) ||
      fallbackValidatorGroup(vote?.validatorGroup);
      return validatorInfo.name;
  }, [vote],
  );

  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(
        getDefaultExplorerView(account.currency),
        address,
      );
      if (url) Linking.openURL(url);
    },
    [account.currency],
  );

  const data = useMemo<DelegationDrawerProps["data"]>(() => {
    const v = vote;
    let status = null;
    if (v != null) {
      status = voteStatus(v);
    }
    
    return v
      ? [
          {
            label: t("celo.delegation.validatorGroup"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {getValidatorName(v) ?? ""}
              </LText>
            ),
          },
          {
            label: t("delegation.validatorAddress"),
            Component: (
              <Touchable
                onPress={() => onOpenExplorer(v.validatorGroup)}
                event="DelegationOpenExplorer"
              >
                <LText
                  numberOfLines={1}
                  semiBold
                  ellipsizeMode="middle"
                  style={[styles.valueText]}
                  color="live"
                >
                  {v.validatorGroup}
                </LText>
              </Touchable>
            ),
          },
          {
            label: t("delegation.delegatedAccount"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {account.name}{" "}
              </LText>
            ),
          },
          {
            label: t("cosmos.delegation.drawer.status"),
            Component: (
              <LText
                numberOfLines={1}
                semiBold
                ellipsizeMode="middle"
                style={[styles.valueText]}
                color="live"
              >
                {!!(status === "active") && <> <CheckCircle color={colors.green } size={14} style={styles.icon}/> <Trans i18nKey={"celo.revoke.steps.vote.active"} /> </>}
                {!!(status === "awaitingActivation") && <> <Loader color={colors.warning } size={14} style={styles.icon}/> <Trans i18nKey={"celo.revoke.steps.vote.awaitingActivation"} /> </>}
                {!!(status === "pending") && <> <Loader color={rgba(colors.grey, 0.8)} size={14} style={styles.icon}/> <Trans i18nKey={"celo.revoke.steps.vote.pending"} /> </>}
              </LText>
            ),
          },
          ...(vote
            ? [
                {
                  label: t("operations.types.VOTE"),
                  Component: (
                    <>
                    <LText
                      numberOfLines={1}
                      semiBold
                      style={[styles.valueText]}
                    >
                      {formatAmount(account as CeloAccount, vote.amount ?? 0)}
                    </LText>
                    </>
                  ),
                },
              ]
            : []),
        ]
      : [];
  }, [vote, t, account, onOpenExplorer]);

  const actions = useMemo<DelegationDrawerActions>(() => {   
    let activateEnabled = false;
    let revokeEnabled = false;
    
    if (vote) {
      const status = voteStatus(vote).toString();
      activateEnabled = status === "awaitingActivation";
      revokeEnabled = status === "active";
    }

    return vote
      ? [
          {
            label: t("celo.delegation.actions.activate"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={activateEnabled ? colors.lightFog : rgba(colors.grey, 0.2)}
              >
                <NominateIcon
                  color={activateEnabled ? colors.grey: rgba(colors.grey, 0.2)}
                  size={24}
                />
              </Circle>
            ),
            disabled: !activateEnabled,
            onPress: () => console.log('onActivate'),
            event: "CeloActionActivateVote",
          },
          {
            label: t("celo.delegation.actions.revoke"),
            Icon: (props: IconProps) => (
              <Circle
                {...props}
                bg={
                  revokeEnabled ? colors.lightFog : rgba(colors.grey, 0.2)
                }
              >
                <RevokeIcon
                  color={revokeEnabled ? colors.grey : rgba(colors.grey, 0.2)}
                  size={24}
                />
              </Circle>
            ),
            disabled: !revokeEnabled,
            onPress: () => console.log('onRevoke'),
            event: "CeloActionRevokeVote",
          },
        ]
      : [];
  }, [vote, account, t, onActivate, onRevoke, onWithdraw, colors.lightFog, colors.fog, colors.grey, colors.yellow, colors.alert]);

  return (
    <View style={styles.root}>
      <DelegationDrawer
        isOpen={data && data.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={({ size }) => (
          <ValidatorImage
            isLedger={vote?.validatorGroup === LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS}
            name={vote ? getValidatorName(vote) : ""}
            size={size}
          />
        )}
        amount={vote?.amount ?? new BigNumber(0)}
        data={data}
        actions={actions}
      />
      {votes.length === 0 ? (
        <AccountDelegationInfo
          title={t("account.delegation.info.title")}
          image={<IlluRewards style={styles.illustration} />}
          description={t("celo.earnRewards.description", {
            name: account.currency.name,
          })}
          infoUrl={urls.celoStakingRewards}
          infoTitle={t("celo.emptyState.info")}
          onPress={onActivate}
          ctaTitle={t("account.delegation.info.cta")}
        />
      ) : (
        <View style={styles.wrapper}>
          <AccountSectionLabel
            name={t("account.delegation.sectionLabel")}
            RightComponent={
              <DelegationLabelRight
                disabled={false}
                onPress={() => console.log('pressed')}
              />
            }
          />

      {!!withdrawEnabled && (<View style={styles.alert}>
          <Alert
            type="warning"
            title={t(
              "celo.alerts.withdrawableAssets",
            )}
            learnMoreKey={t(
              "celo.withdraw.title",
            )}
            onLearnMore={onWithdraw}
            learnMoreIsInternal={true}
            >
          </Alert>
        </View>
        )}
        
        {!!activatingEnabled && (<View style={styles.alert}>
          <Alert
            type="warning"
            title={t(
              "celo.alerts.activatableVotes",
            )}
            learnMoreKey={t(
              "celo.activate.title",
            )}
            onLearnMore={onActivate}
            learnMoreIsInternal={true}
            >
          </Alert>
        </View>
        )}
        
        {votes?.map((v, i) => (
            <>
            <View
              key={v.validatorGroup}
              style={[
                styles.delegationsWrapper,
              ]}
            >
              <DelegationRow
                account={account as CeloAccount}
                vote={v}
                currency={currency}
                onPress={() => setVote(v)}
                isLast={i === votes?.length - 1}
                getValidatorName={getValidatorName}
              />
            </View>
            </>
          ))}
        </View>
      )}
    </View>
  );
}

export default function CeloDelegations({ account }: Props) {
  if (!(account as CeloAccount).celoResources) return null;
  return <Delegations account={account} />;
}

const styles = StyleSheet.create({
  root: {
    marginHorizontal: 16,
  },
  illustration: { alignSelf: "center", marginBottom: 16 },
  rewardsWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignContent: "center",
    paddingVertical: 16,
    marginBottom: 16,

    borderRadius: 4,
  },
  label: {
    fontSize: 20,
    flex: 1,
  },
  subLabel: {
    fontSize: 14,

    flex: 1,
  },
  column: {
    flexDirection: "column",
  },
  wrapper: {
    marginBottom: 16,
  },
  delegationsWrapper: {
    borderRadius: 4,
  },
  valueText: {
    fontSize: 14,
  },
  alert: {
    marginTop: 4,
  },
  underline: {
    fontWeight: "500",
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
  },
  icon: {
    alignSelf: "flex-end",
    marginStart: 4,
  }
});
