import { getAddressExplorer, getDefaultExplorerView } from "@ledgerhq/live-common/explorers";
import {
  FEE_CURRENCY_BY_ADAPTER,
  NATIVE_FEE_CURRENCY_MARKER,
} from "@ledgerhq/live-common/families/celo/constants";
import { fallbackValidatorGroup } from "@ledgerhq/live-common/families/celo/logic";
import { getCeloTransactionFeeCurrency } from "@ledgerhq/live-common/families/celo/network";
import { useCeloPreloadData } from "@ledgerhq/live-common/families/celo/react";
import { CeloAccount, CeloOperation } from "@ledgerhq/live-common/families/celo/types";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/hooks";
import { useQuery } from "@tanstack/react-query";
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
  if (url) openURL(url);
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
const resolveFeeTokenFromAdapter = (
  adapter: string,
  account: CeloAccount,
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
  operation: CeloOperation,
  account: CeloAccount,
): CryptoCurrency | TokenCurrency | undefined => {
  const storedAddress = operation.extra?.feeCurrencyAddress;
  // Fall back to an on-chain lookup when the bridge hasn't enriched the op
  // yet. Skipped when we already have a stored value (including the NATIVE
  // sentinel) or the op isn't confirmed on chain.
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
  // NATIVE sentinel: confirmed non-CIP-64, no token to resolve.
  const raw = storedAddress ?? fetchedAddress ?? undefined;
  const adapter = raw && raw !== NATIVE_FEE_CURRENCY_MARKER ? raw : undefined;
  const option = adapter ? FEE_CURRENCY_BY_ADAPTER.get(adapter.toLowerCase()) : undefined;
  const contract = option?.contractAddress?.toLowerCase() ?? adapter?.toLowerCase() ?? "";

  // CAL fallback for received txs where the user doesn't hold the fee token.
  const { token: tokenFromCal } = useTokenByAddressInCurrency(contract, account.currency.id, {
    skip: !contract,
  });

  if (!adapter) return undefined;
  return resolveFeeTokenFromAdapter(adapter, account) ?? tokenFromCal;
};

/**
 * CIP-64 normalizes gas price to 18 decimals via the fee-currency adapter,
 * so `operation.fee` is 10^(18 - magnitude) too large for non-18-dec fee
 * tokens (e.g. USDT/USDC at 6 decimals). Rescale to the token's native units
 * so both `FormattedVal` (unit-based) and `CounterValue` (magnitude-based)
 * render consistently.
 */
const getDisplayFee = (
  operation: CeloOperation,
  _account: CeloAccount,
  currency: CryptoCurrency | TokenCurrency,
): BigNumber | undefined => {
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
