import {
  getAddressExplorer,
  getDefaultExplorerView,
  CryptoCurrency,
} from "@domain/entity-currency-crypto";
import {
  FEE_CURRENCY_BY_ADAPTER,
  NATIVE_FEE_CURRENCY_MARKER,
} from "@ledgerhq/live-common/families/celo/constants";
import { fallbackValidatorGroup } from "@ledgerhq/live-common/families/celo/logic";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import { CeloAccount, CeloOperation } from "@ledgerhq/live-common/families/celo/types";
import { TokenCurrency } from "@domain/entity-currency-token";
import { useFindTokenByAddressInCurrencyQuery } from "@domain/api-currency-token";
import BigNumber from "bignumber.js";
import React from "react";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box";
import FormattedVal from "~/renderer/components/FormattedVal";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCellShared";
import Text from "~/renderer/components/Text";
import {
  Address,
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
  OpDetailsVoteData,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { openURL } from "~/renderer/linking";
import { OperationDetailsExtraProps } from "../types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

const redirectAddress = (currency: CryptoCurrency, address: string) => () => {
  const url = getAddressExplorer(getDefaultExplorerView(currency), address);
  if (url) openURL(url, "OpenURL", {}, { sensitive: true });
};

const OperationDetailsExtra = ({
  operation,
  type,
  account,
}: OperationDetailsExtraProps<CeloAccount, CeloOperation>) => {
  const { currency } = account;

  const unit = useAccountUnit(account);
  const { validatorGroups } = useCeloPreloadData();
  switch (type) {
    case "ACTIVATE":
    case "REVOKE":
    case "VOTE": {
      const recipient = operation.recipients[0];
      const validatorGroup = recipient
        ? validatorGroups.find(
            validatorGroup => validatorGroup.address.toLowerCase() === recipient.toLowerCase(),
          ) || fallbackValidatorGroup(recipient)
        : null;
      return (
        <>
          {type !== "ACTIVATE" && operation.extra.celoOperationValue && (
            <OpDetailsSection>
              <OpDetailsTitle>
                <Trans i18nKey={`operation.type.${type}`} />
              </OpDetailsTitle>
              <OpDetailsData>
                <Box>
                  <FormattedVal
                    val={operation.extra.celoOperationValue}
                    unit={unit}
                    showCode
                    fontSize={4}
                    color="neutral.c70"
                  />
                </Box>
              </OpDetailsData>
            </OpDetailsSection>
          )}
          <OpDetailsSection>
            <OpDetailsTitle>
              <Trans i18nKey={"celo.delegation.validatorGroup"} />
            </OpDetailsTitle>
            {validatorGroup ? (
              <Box flex="1" pl={2}>
                <OpDetailsData justifyContent="flex-start">
                  <OpDetailsVoteData>
                    <Box>
                      <Text ff="Inter|SemiBold">{validatorGroup.name}</Text>
                    </Box>
                    <Address onClick={redirectAddress(currency, validatorGroup.address)}>
                      <SplitAddress value={validatorGroup.address} />
                    </Address>
                  </OpDetailsVoteData>
                </OpDetailsData>
              </Box>
            ) : null}
          </OpDetailsSection>
        </>
      );
    }
    case "LOCK":
    case "UNLOCK":
      return (
        <>
          {operation.extra.celoOperationValue && (
            <OpDetailsSection>
              <OpDetailsTitle>
                <Trans i18nKey={`operation.type.${type}`} />
              </OpDetailsTitle>
              <OpDetailsData>
                <Box>
                  <FormattedVal
                    val={operation.extra.celoOperationValue}
                    unit={unit}
                    showCode
                    fontSize={4}
                    color="neutral.c70"
                  />
                </Box>
              </OpDetailsData>
            </OpDetailsSection>
          )}
        </>
      );
    default:
      return null;
  }
};
/**
 * The contract of the token that paid the fee: `feeAsset`, or the token behind the CIP-64 fee
 * currency of a pending operation built before `feeAsset` existed.
 */
const readFeeTokenContract = (operation: CeloOperation): string | undefined => {
  const { feeAsset, feeCurrencyAddress } = operation.extra ?? {};
  if (feeAsset) return feeAsset;
  if (!feeCurrencyAddress || feeCurrencyAddress === NATIVE_FEE_CURRENCY_MARKER) return undefined;
  const adapter = feeCurrencyAddress.toLowerCase();
  return FEE_CURRENCY_BY_ADAPTER.get(adapter)?.contractAddress?.toLowerCase() ?? adapter;
};

/** The fee currency: CELO (undefined), the fee token, or null while that token is unresolved. */
const useFeesCurrency = (
  operation: CeloOperation,
  account: CeloAccount,
): CryptoCurrency | TokenCurrency | null | undefined => {
  const contract = readFeeTokenContract(operation);
  const tokenAccount = contract
    ? (account.subAccounts ?? []).find(
        sub => sub.type === "TokenAccount" && sub.token.contractAddress.toLowerCase() === contract,
      )
    : undefined;
  const tokenFromAccount = tokenAccount?.type === "TokenAccount" ? tokenAccount.token : undefined;

  // CAL fallback for a fee token the account does not hold, as on a received transaction
  const { data: tokenFromCal } = useFindTokenByAddressInCurrencyQuery(
    { contract_address: contract ?? "", network: account.currency.id },
    { skip: !contract || !!tokenFromAccount },
  );

  if (!contract) return undefined;
  return tokenFromAccount ?? tokenFromCal ?? null;
};

/**
 * The fee of a pending operation built before `feeAsset` existed is in the CIP-64 adapter's
 * 18-decimal units: rescaled to the token's own units. Every other fee is already in them.
 */
const getDisplayFee = (
  operation: CeloOperation,
  _account: CeloAccount,
  currency: CryptoCurrency | TokenCurrency,
): BigNumber | undefined => {
  if (operation.extra?.feeAsset || !operation.extra?.feeCurrencyAddress) return undefined;
  if (currency.type !== "TokenCurrency") return undefined;
  const magnitude = currency.units[0]?.magnitude;
  // magnitude >= 18: shift would be <= 1, dividing would inflate not shrink.
  if (magnitude == null || magnitude >= 18) return undefined;
  const shift = new BigNumber(10).pow(18 - magnitude);
  return operation.fee.dividedBy(shift).integerValue(BigNumber.ROUND_FLOOR);
};

export default {
  OperationDetailsExtra,
  useFeesCurrency,
  getDisplayFee,
};
