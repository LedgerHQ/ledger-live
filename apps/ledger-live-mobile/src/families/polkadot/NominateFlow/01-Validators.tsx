import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  Linking,
  SectionListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import type {
  Transaction,
  PolkadotValidator,
  PolkadotAccount,
} from "@ledgerhq/live-common/families/polkadot/types";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import {
  MAX_NOMINATIONS,
  hasMinimumBondBalance,
} from "@ledgerhq/live-common/families/polkadot/logic";
import { PolkadotValidatorsRequired } from "@ledgerhq/live-common/families/polkadot/errors";
import {
  usePolkadotPreloadData,
  useSortedValidators,
} from "@ledgerhq/live-common/families/polkadot/react";
import { accountScreenSelector } from "~/reducers/accounts";
import { NavigatorName, ScreenName } from "~/const";
import Button from "~/components/Button";
import SelectValidatorSearchBox from "~/families/tron/VoteFlow/01-SelectValidator/SearchBox";
import LText from "~/components/LText";
import Alert from "~/components/Alert";
import TranslatedError from "~/components/TranslatedError";
import Check from "~/icons/Check";
import { getFirstStatusError } from "../../helpers";
import FlowErrorBottomModal from "../components/FlowErrorBottomModal";
import NominationDrawer from "../components/NominationDrawer";
import SendRowsFee from "../SendRowsFee";
import ValidatorItem from "./ValidatorItem";
import { getDrawerInfo } from "./drawerInfo";
import type {
  BaseComposite,
  StackNavigatorNavigation,
  StackNavigatorProps,
} from "~/components/RootNavigator/types/helpers";
import type { PolkadotNominateFlowParamList } from "./types";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import FirstLetterIcon from "~/components/FirstLetterIcon";
import { useSettings } from "~/hooks";

type Props = BaseComposite<
  StackNavigatorProps<PolkadotNominateFlowParamList, ScreenName.PolkadotNominateSelectValidators>
>;

function NominateSelectValidator({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const { locale } = useSettings();
  invariant(account, "account required");
  const mainAccount = getMainAccount(account, parentAccount) as PolkadotAccount;
  const bridge = getAccountBridge(account, parentAccount);
  const [drawerValidator, setDrawerValidator] = useState<PolkadotValidator | null | undefined>();
  const { polkadotResources } = mainAccount;
  invariant(polkadotResources, "polkadotResources required");
  const bridgeTransaction = useBridgeTransaction(() => {
    const tx = route.params.transaction;

    if (!tx) {
      const t = bridge.createTransaction(mainAccount);
      const initialValidators = (mainAccount.polkadotResources?.nominations || [])
        .filter(nomination => !!nomination.status)
        .map(nomination => nomination.address);
      return {
        account,
        transaction: bridge.updateTransaction(t, {
          mode: "nominate",
          validators: initialValidators,
        }),
      };
    }

    return {
      account,
      transaction: tx,
    };
  });

  const { setTransaction, status, bridgePending, bridgeError } = bridgeTransaction;
  const { transaction } = bridgeTransaction as { transaction: Transaction };

  invariant(transaction && transaction.validators, "transaction and validators required");
  const [searchQuery, setSearchQuery] = useState("");
  const validators = useMemo(() => transaction.validators || [], [transaction.validators]);
  const nominations = useMemo(
    () => polkadotResources.nominations || [],
    [polkadotResources.nominations],
  );
  // Addresses that are no longer validators
  const nonValidators = useMemo(
    () =>
      (polkadotResources.nominations || [])
        .filter(nomination => !nomination.status)
        .map(nomination => nomination.address),
    [polkadotResources.nominations],
  );
  const preloaded = usePolkadotPreloadData();
  const { staking, validators: polkadotValidators } = preloaded;
  const minimumBondBalance = BigNumber(preloaded.minimumBondBalance);
  const hasMinBondBalance = hasMinimumBondBalance(mainAccount);
  const minBondBalance = formatCurrencyUnit(mainAccount.unit, minimumBondBalance, {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet: false,
    locale: locale,
  });
  const maxNominatorRewardedPerValidator = staking?.maxNominatorRewardedPerValidator || 300;
  const sorted = useSortedValidators(searchQuery, polkadotValidators, nominations);
  const sections = useMemo(
    () =>
      sorted
        .reduce(
          (data, validator) => {
            const isNominated = nominations.some(n => n.address === validator.address);

            if (isNominated) {
              data[0].data.push(validator);
            } else if (validator.isElected) {
              data[1].data.push(validator);
            } else {
              data[2].data.push(validator);
            }

            return data;
          },
          [
            {
              title: <Trans i18nKey="polkadot.nominate.steps.validators.myNominations" />,
              data: [] as PolkadotValidator[],
            },
            {
              title: <Trans i18nKey="polkadot.nominate.steps.validators.electedValidators" />,
              data: [] as PolkadotValidator[],
            },
            {
              title: <Trans i18nKey="polkadot.nominate.steps.validators.waitingValidators" />,
              data: [] as PolkadotValidator[],
            },
          ],
        )
        .filter(({ data }) => data.length > 0),
    [sorted, nominations],
  );
  const onNext = useCallback(() => {
    setDrawerValidator(undefined);
    navigation.navigate(ScreenName.PolkadotNominateSelectDevice, {
      ...route.params,
      transaction,
      status,
    });
  }, [navigation, route.params, transaction, status]);
  const onSelect = useCallback(
    (validator: PolkadotValidator, selected: boolean) => {
      setDrawerValidator(undefined);
      const newValidators = selected
        ? validators.filter(v => v !== validator.address)
        : [...validators, validator.address];
      const tx = bridge.updateTransaction(transaction, {
        validators: newValidators,
      });
      setTransaction(tx);
    },
    [bridge, setTransaction, transaction, validators],
  );
  const onOpenExplorer = useCallback(
    (address: string) => {
      const url = getAddressExplorer(getDefaultExplorerView(mainAccount.currency), address);
      if (url) Linking.openURL(url);
    },
    [mainAccount.currency],
  );
  const onOpenDrawer = useCallback(
    (address: string) => {
      const validator = polkadotValidators.find(v => v.address === address);
      setDrawerValidator(validator);
    },
    [polkadotValidators],
  );
  const onCloseDrawer = useCallback(() => {
    setDrawerValidator(undefined);
  }, []);
  const onGoToChill = useCallback(() => {
    setDrawerValidator(undefined);
    navigation.getParent<StackNavigatorNavigation<BaseNavigatorStackParamList>>().pop();
    navigation.navigate(NavigatorName.PolkadotSimpleOperationFlow, {
      screen: ScreenName.PolkadotSimpleOperationStarted,
      params: {
        mode: "chill",
        accountId: account.id,
      },
    });
  }, [navigation, account.id]);
  const drawerInfo = useMemo(
    () =>
      drawerValidator
        ? getDrawerInfo({
            t,
            account,
            onOpenExplorer,
            maxNominatorRewardedPerValidator,
            validator: drawerValidator,
          })
        : [],
    [drawerValidator, t, account, maxNominatorRewardedPerValidator, onOpenExplorer],
  );
  const renderItem: SectionListRenderItem<PolkadotValidator> = useCallback(
    ({ item }) => {
      const selected = validators.indexOf(item.address) > -1;
      const disabled = validators.length >= MAX_NOMINATIONS;
      return (
        <ValidatorItem
          item={item}
          disabled={disabled}
          selected={selected}
          onSelect={onSelect}
          onClick={onOpenDrawer}
        />
      );
    },
    [validators, onSelect, onOpenDrawer],
  );
  const error = getFirstStatusError(status, "errors");
  const warning = getFirstStatusError(status, "warnings");
  const maxSelected = validators.length === MAX_NOMINATIONS;
  const maybeChill = error instanceof PolkadotValidatorsRequired;
  const ignoreError = error instanceof PolkadotValidatorsRequired && !nominations.length;
  // Do not show error on first nominate
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background.main,
        },
      ]}
    >
      <NominationDrawer
        isOpen={drawerInfo && drawerInfo.length > 0}
        onClose={onCloseDrawer}
        account={account}
        ValidatorImage={() => <FirstLetterIcon label={drawerValidator?.identity || "-"} />}
        data={drawerInfo}
      />
      <View>
        {!hasMinBondBalance ? (
          <Alert type="warning">
            <Trans
              i18nKey="polkadot.bondedBalanceBelowMinimum"
              values={{
                minimumBondBalance: minBondBalance,
              }}
            />
          </Alert>
        ) : null}
        {nonValidators.length ? (
          <Alert type="warning">
            <Trans
              i18nKey="polkadot.nominate.steps.validators.notValidatorsRemoved"
              values={{
                count: nonValidators.length,
              }}
            />
          </Alert>
        ) : null}
      </View>
      <SelectValidatorSearchBox searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      {sections.length <= 0 && (
        <View style={styles.noResult}>
          <LText style={styles.textCenter}>
            <Trans
              i18nKey="polkadot.nominate.steps.validators.noResultsFound"
              values={{
                search: searchQuery,
              }}
            >
              <LText bold>{""}</LText>
            </Trans>
          </LText>
        </View>
      )}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.address + index}
        renderItem={renderItem}
        stickySectionHeadersEnabled
        renderSectionHeader={({ section: { title } }) => (
          <LText
            style={[
              styles.header,
              {
                backgroundColor: colors.neutral.c30,
              },
            ]}
            color={colors.neutral.c70}
          >
            {title}
          </LText>
        )}
      />

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.neutral.c30,
            backgroundColor: colors.background.main,
          },
        ]}
      >
        <View style={styles.paddingBottom}>
          <View style={styles.labelContainer}>
            {!ignoreError && maybeChill ? (
              <TouchableOpacity onPress={onGoToChill}>
                <LText semiBold style={[styles.footerMessage]} color={colors.primary.c80}>
                  <Trans i18nKey="polkadot.nominate.steps.validators.maybeChill" />
                </LText>
              </TouchableOpacity>
            ) : (
              <>
                {maxSelected && <Check size={12} color={colors.success.c50} />}
                <LText
                  style={[
                    styles.footerMessage,
                    maxSelected && {
                      color: colors.success.c50,
                    },
                    !ignoreError &&
                      warning && {
                        color: colors.warning.c50,
                      },
                    !ignoreError &&
                      error && {
                        color: colors.error.c50,
                      },
                  ]}
                >
                  {!ignoreError && (error || warning) ? (
                    <TranslatedError error={error || warning} />
                  ) : (
                    <Trans
                      i18nKey="polkadot.nominate.steps.validators.selected"
                      values={{
                        selected: validators.length,
                        total: MAX_NOMINATIONS,
                      }}
                    />
                  )}
                </LText>
              </>
            )}
          </View>
        </View>
        <SendRowsFee account={account} transaction={transaction} />
        <Button
          disabled={!!error || bridgePending}
          event="PolkadotNominateSelectValidatorsContinue"
          onPress={onNext}
          title={
            <Trans i18nKey={!bridgePending ? "common.continue" : "send.amount.loadingNetwork"} />
          }
          type="primary"
        />
      </View>

      <FlowErrorBottomModal
        navigation={navigation}
        transaction={transaction}
        account={account}
        parentAccount={parentAccount}
        setTransaction={setTransaction}
        bridgeError={bridgeError}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  noResult: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    height: 32,
    paddingHorizontal: 16,
    lineHeight: 32,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerMessage: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 12,
    paddingHorizontal: 6,
  },
  textCenter: {
    textAlign: "center",
  },
  paddingBottom: {
    paddingBottom: 8,
  },
});
export default NominateSelectValidator;
