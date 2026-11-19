import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import BigNumber from "bignumber.js";
import {
  getDefaultExplorerView,
  getAddressExplorer,
  CryptoCurrency,
} from "@domain/entity-currency-crypto";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import {
  CeloAccount,
  CeloOperation,
  isCeloOperationExtra,
} from "@ledgerhq/live-common/families/celo/types";
import { TokenCurrency } from "@domain/entity-currency-token";
import {
  FEE_CURRENCY_BY_ADAPTER,
  NATIVE_FEE_CURRENCY_MARKER,
} from "@ledgerhq/live-common/families/celo/constants";
import { useTokenByAddressInCurrency } from "@features/platform-currencies";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useRoute } from "@react-navigation/native";
import Section from "~/screens/OperationDetails/Section";
import { discreetModeSelector } from "~/reducers/settings";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import { useSettings } from "~/hooks";
import { useAccountUnit } from "LLM/hooks/useAccountUnit";

type Props = {
  operation: CeloOperation;
  type: OperationType;
  account: CeloAccount;
};

type Navigation = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.OperationDetails>;

const OperationDetailsExtra = ({ operation, type, account }: Props) => {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const { locale } = useSettings();
  const unit = useAccountUnit(account);
  const { validatorGroups: celoValidators } = useCeloPreloadData();
  const { extra } = operation;
  const optimisticOperation = useRoute<Navigation["route"]>().params?.operation ?? null;

  const redirectAddressCreator = useCallback(
    (address?: string) => () => {
      if (!address) return;
      const url = getAddressExplorer(getDefaultExplorerView(account.currency), address);
      if (url) Linking.openURL(url);
    },
    [account],
  );

  let ret = null;
  const recipient = extra.celoSourceValidator;
  const validatorGroup = recipient
    ? celoValidators.find(
        validatorGroup => validatorGroup.address.toLowerCase() === recipient.toLowerCase(),
      )
    : null;

  let opValue = "";
  if (extra.celoOperationValue != null) {
    opValue = extra.celoOperationValue.toString();
  } else if (optimisticOperation.value != null) {
    opValue = optimisticOperation.value.toString();
  }

  const formattedAmount = formatCurrencyUnit(unit, new BigNumber(opValue), {
    disableRounding: true,
    alwaysShowSign: false,
    showCode: true,
    discreet,
    locale,
  });

  switch (type) {
    case "ACTIVATE":
    case "REVOKE":
    case "VOTE":
    case "UNLOCK":
    case "LOCK":
      ret = (
        <>
          {(validatorGroup || extra.celoSourceValidator) && (
            <Section
              testID="celo-operationDetails-validatorGroup"
              title={t(`delegation.validatorGroup`)}
              value={validatorGroup?.name || extra.celoSourceValidator}
              onPress={redirectAddressCreator(validatorGroup?.address || extra.celoSourceValidator)}
            />
          )}
          {type !== "ACTIVATE" && (
            <>
              <Section title={t(`operations.types.${type}`)} value={formattedAmount} />
            </>
          )}
        </>
      );
      break;
    default:
      break;
  }

  return <>{ret}</>;
};

/**
 * The contract of the token that paid the fee: `feeAsset`, or the token behind the CIP-64 fee
 * currency of a pending operation built before `feeAsset` existed.
 */
const readFeeTokenContract = (operation: Operation): string | undefined => {
  if (!isCeloOperationExtra(operation.extra)) return undefined;
  const { feeAsset, feeCurrencyAddress } = operation.extra;
  if (feeAsset) return feeAsset;
  if (!feeCurrencyAddress || feeCurrencyAddress === NATIVE_FEE_CURRENCY_MARKER) return undefined;
  const adapter = feeCurrencyAddress.toLowerCase();
  return FEE_CURRENCY_BY_ADAPTER.get(adapter)?.contractAddress?.toLowerCase() ?? adapter;
};

/**
 * The fee currency: CELO (undefined), the fee token, or null while that token is unresolved.
 * Takes a broad `Account` rather than CeloAccount so it composes with the generic caller without a
 * cast; the only fields touched (`subAccounts`, `currency.id`) exist on both.
 */
const useFeesCurrency = (
  operation: Operation,
  account: Account,
): CryptoCurrency | TokenCurrency | null | undefined => {
  const contract = readFeeTokenContract(operation);
  const tokenAccount = contract
    ? (account.subAccounts ?? []).find(
        sub => sub.type === "TokenAccount" && sub.token.contractAddress.toLowerCase() === contract,
      )
    : undefined;
  const tokenFromAccount = tokenAccount?.type === "TokenAccount" ? tokenAccount.token : undefined;

  // CAL fallback for a fee token the account does not hold, as on a received transaction
  const { token: tokenFromCal } = useTokenByAddressInCurrency(contract ?? "", account.currency.id, {
    skip: !contract || !!tokenFromAccount,
  });

  if (!contract) return undefined;
  return tokenFromAccount ?? tokenFromCal ?? null;
};

/**
 * The fee of a pending operation built before `feeAsset` existed is in the CIP-64 adapter's
 * 18-decimal units: rescaled to the token's own units. Every other fee is already in them.
 */
const getDisplayFee = (
  operation: Operation,
  _account: Account,
  currency: CryptoCurrency | TokenCurrency,
): BigNumber | undefined => {
  if (!isCeloOperationExtra(operation.extra)) return undefined;
  if (operation.extra.feeAsset || !operation.extra.feeCurrencyAddress) return undefined;
  if (currency.type !== "TokenCurrency") return undefined;
  const magnitude = currency.units[0]?.magnitude;
  if (magnitude == null || magnitude >= 18) return undefined;
  const shift = new BigNumber(10).pow(18 - magnitude);
  return operation.fee.dividedBy(shift).integerValue(BigNumber.ROUND_FLOOR);
};

export default {
  OperationDetailsExtra,
  useFeesCurrency,
  getDisplayFee,
};
