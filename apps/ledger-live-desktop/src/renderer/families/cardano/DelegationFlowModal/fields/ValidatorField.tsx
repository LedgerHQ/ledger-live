import { useCardanoFamilyPools } from "@ledgerhq/live-common/families/cardano/react";
import {
  DEFAULT_SELECTED_POOL_ID,
  LEDGER_POOL_IDS,
  StakePool,
  fetchPoolDetails,
} from "@ledgerhq/live-common/families/cardano/staking";
import { CardanoDelegation } from "@ledgerhq/live-common/families/cardano/types";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import React, { useCallback, useEffect, useState } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import BigSpinner from "~/renderer/components/BigSpinner";
import Box from "~/renderer/components/Box";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import Text from "~/renderer/components/Text";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ScrollLoadingList from "../ScrollLoadingList";
import ValidatorRow from "./ValidatorRow";

type Props = {
  t: TFunction;
  account: Account;
  status: TransactionStatus;
  delegation?: CardanoDelegation;
  onChangeValidator: (a: StakePool) => void;
  selectedPoolId: string;
};

export function concatUserAndLedgerPoolIds(
  userLastUsedPool: string | undefined,
  ledgerPoolIds: string[],
): string[] {
  return userLastUsedPool ? [userLastUsedPool, ...ledgerPoolIds] : [...ledgerPoolIds];
}

export function putUserPoolAtFirstPositionInPools(
  pools: StakePool[],
  firstPoolId: string,
): StakePool[] {
  const index = pools.findIndex(pool => pool.poolId === firstPoolId);
  if (index === -1) {
    return pools;
  }

  const pool = { ...pools[index] };
  return [pool, ...pools.filter((_, i) => i !== index)];
}

export async function fetchAndSortPools(
  currency: CryptoCurrency,
  poolIds: string[],
  userLastUsedPoolId: string,
) {
  const response = await fetchPoolDetails(currency, poolIds);
  const sortedPools = putUserPoolAtFirstPositionInPools(response.pools, userLastUsedPoolId);
  return sortedPools;
}

const ValidatorField = ({ account, delegation, onChangeValidator, selectedPoolId }: Props) => {
  const unit = useAccountUnit(account);
  const [showAll, setShowAll] = useState(false);
  const [userAndLedgerPools, setUserAndLedgerPools] = useState<Array<StakePool>>([]);
  const [userAndLedgerPoolsLoading, setUserAndLedgerPoolsLoading] = useState(false);
  const { pools, searchQuery, setSearchQuery, onScrollEndReached, isSearching, isPaginating } =
    useCardanoFamilyPools(account.currency);

  const userAndLedgerPoolIds = concatUserAndLedgerPoolIds(delegation?.poolId, LEDGER_POOL_IDS);

  useEffect(() => {
    setUserAndLedgerPoolsLoading(true);
    fetchAndSortPools(account.currency, userAndLedgerPoolIds, DEFAULT_SELECTED_POOL_ID).then(
      (sortedPools: StakePool[]) => {
        setUserAndLedgerPools(sortedPools);
        onChangeValidator(sortedPools[0]);
        setUserAndLedgerPoolsLoading(false);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selectedPool =
      pools.find(p => p.poolId === selectedPoolId) ||
      userAndLedgerPools.find(pool => pool.poolId === selectedPoolId);

    if (selectedPool) {
      if (pools.some(p => p.poolId === selectedPoolId)) {
        onChangeValidator(selectedPool);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPoolId]);

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(evt.target.value),
    [setSearchQuery],
  );
  const renderItem = (validator: StakePool, validatorIdx: number) => {
    return (
      <ValidatorRow
        currency={account.currency}
        key={validatorIdx + validator.poolId}
        pool={validator}
        unit={unit}
        active={
          selectedPoolId === validator.poolId ||
          (validator.poolId === delegation?.poolId && validator.poolId === selectedPoolId)
        }
        onClick={onChangeValidator}
      />
    );
  };

  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={searchQuery} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="validator-list">
          {(showAll && isSearching) ||
          (!showAll && userAndLedgerPoolsLoading) ||
          (!showAll && !pools.length) ? (
            <Box flex={1} py={3} alignItems="center" justifyContent="center">
              <BigSpinner size={35} />
            </Box>
          ) : (
            <ScrollLoadingList
              data={
                showAll
                  ? [
                      ...userAndLedgerPools,
                      ...pools.filter(p => p && !userAndLedgerPoolIds.includes(p.poolId)),
                    ]
                  : [userAndLedgerPools[0]]
              }
              style={{
                flex: showAll ? "1 0 256px" : "1 0 64px",
                marginBottom: 0,
                paddingLeft: 0,
              }}
              renderItem={renderItem}
              noResultPlaceholder={null}
              fetchPoolsFromNextPage={onScrollEndReached}
              search={searchQuery}
              isPaginating={isPaginating}
            />
          )}
        </Box>
        {userAndLedgerPoolIds.length > 1 ? (
          <SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
            <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
              <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
            </Text>
            <IconAngleDown size={16} />
          </SeeAllButton>
        ) : null}
      </ValidatorsFieldContainer>
    </>
  );
};

const ValidatorsFieldContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
`;

const SeeAllButton = styled.div<{
  expanded: boolean;
}>`
  display: flex;
  color: ${p => p.theme.colors.wallet};
  align-items: center;
  justify-content: center;
  border-top: 1px solid ${p => p.theme.colors.palette.divider};
  height: 40px;
  cursor: pointer;

  &:hover ${Text} {
    text-decoration: underline;
  }

  > :nth-child(2) {
    margin-left: 8px;
    transform: rotate(${p => (p.expanded ? "180deg" : "0deg")});
  }
`;

export default ValidatorField;
