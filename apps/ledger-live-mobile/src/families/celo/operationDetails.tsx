import React, { useCallback } from "react";
import { Linking } from "react-native";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { BigNumber } from "bignumber.js";
import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import {
  CeloAccount,
  CeloOperation,
  isCeloOperationExtra,
} from "@ledgerhq/live-common/families/celo/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  FEE_CURRENCY_BY_ADAPTER,
  NATIVE_FEE_CURRENCY_MARKER,
} from "@ledgerhq/live-common/families/celo/constants";
import { getCeloTransactionFeeCurrency } from "@ledgerhq/live-common/families/celo/network";
import { useTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/hooks";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useQuery } from "@tanstack/react-query";
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

// Broad `Account` rather than CeloAccount so this composes with the generic
// caller without a cast; the only fields touched (`subAccounts`, `currency.id`)
// exist on both.
const resolveFeeTokenFromAdapter = (
  adapter: string,
  account: Account,
): TokenCurrency | undefined => {
  const adapterLower = adapter.toLowerCase();
  const option = FEE_CURRENCY_BY_ADAPTER.get(adapterLower);
  const contract = option?.contractAddress?.toLowerCase() ?? adapterLower;
  const tokenAccount = (account.subAccounts ?? []).find(
    sub => sub.type === "TokenAccount" && sub.token.contractAddress.toLowerCase() === contract,
  );
  return tokenAccount?.type === "TokenAccount" ? tokenAccount.token : undefined;
};

const useFeesCurrency = (
  operation: Operation,
  account: Account,
): CryptoCurrency | TokenCurrency | undefined => {
  const storedAddress = isCeloOperationExtra(operation.extra)
    ? operation.extra.feeCurrencyAddress
    : undefined;
  const { data: fetchedAddress } = useQuery({
    queryKey: ["celo.feeCurrency", account.currency.id, operation.hash],
    queryFn: () => getCeloTransactionFeeCurrency(operation.hash),
    enabled:
      !storedAddress &&
      !!operation.hash &&
      operation.blockHeight != null &&
      operation.blockHeight > 0,
    staleTime: Infinity,
    // Sync recovers from transient failures via the bridge's own enrichment pass.
    retry: false,
  });
  const raw = storedAddress ?? fetchedAddress ?? undefined;
  const adapter = raw && raw !== NATIVE_FEE_CURRENCY_MARKER ? raw : undefined;
  const option = adapter ? FEE_CURRENCY_BY_ADAPTER.get(adapter.toLowerCase()) : undefined;
  const contract = option?.contractAddress?.toLowerCase() ?? adapter?.toLowerCase() ?? "";
  const { token: tokenFromCal } = useTokenByAddressInCurrency(contract, account.currency.id, {
    skip: !contract,
  });
  if (!adapter) return undefined;
  return resolveFeeTokenFromAdapter(adapter, account) ?? tokenFromCal;
};

/** CIP-64 stores fees in 18-decimal normalized units; rescale to the fee
 *  token's native magnitude for consistent display + counter-value. */
const getDisplayFee = (
  operation: Operation,
  _account: Account,
  currency: CryptoCurrency | TokenCurrency,
): BigNumber | undefined => {
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
