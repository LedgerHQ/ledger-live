import React, { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "../ScrollLoadingList";
import { Trans } from "react-i18next";
import { TFunction } from "i18next";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorRow from "./ValidatorRow";
import { Account } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import {
  LEDGER_POOL_IDS,
  StakePool,
  fetchPoolDetails,
} from "@ledgerhq/live-common/families/cardano/staking";
import { useCardanoFamilyPools } from "@ledgerhq/live-common/families/cardano/react";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import { CardanoDelegation } from "@ledgerhq/live-common/families/cardano/types";
import BigSpinner from "~/renderer/components/BigSpinner";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = {
  t: TFunction;
  account: Account;
  status: TransactionStatus;
  delegation?: CardanoDelegation;
  onChangeValidator: (a: StakePool) => void;
  selectedPoolId: string;
};

const ValidatorField = ({ account, delegation, onChangeValidator, selectedPoolId }: Props) => {
  const [currentPool, setCurrentPool] = useState<Array<StakePool>>([]);
  const [defaultPool, setDefaultPool] = useState<Array<StakePool>>([]);
  const unit = useAccountUnit(account);
  const [showAll, setShowAll] = useState(false);
  const [ledgerPoolsLoading, setLedgerPoolsLoading] = useState(false);
  const { pools, searchQuery, setSearchQuery, onScrollEndReached, isSearching, isPaginating } =
    useCardanoFamilyPools(account.currency);

  const poolIdsToFilterFromAllPools = [...LEDGER_POOL_IDS];
  if (delegation?.poolId) {
    poolIdsToFilterFromAllPools.push(delegation?.poolId);
  }

  useEffect(() => {
    if (LEDGER_POOL_IDS.length) {
      setLedgerPoolsLoading(true);
      const delegationPoolId = delegation?.poolId
        ? [delegation.poolId, ...LEDGER_POOL_IDS]
        : LEDGER_POOL_IDS;
      fetchPoolDetails(account.currency, delegationPoolId)
        .then((apiRes: { pools: Array<StakePool> }) => {
          setCurrentPool([apiRes.pools[0]]);
          const filteredPools = apiRes.pools.filter(pool => LEDGER_POOL_IDS.includes(pool.poolId));
          setDefaultPool(filteredPools);
          if (filteredPools.length) {
            onChangeValidator(filteredPools[0]);
          }
        })
        .finally(() => {
          setLedgerPoolsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selectedPool =
      pools.find(p => p.poolId === selectedPoolId) ||
      defaultPool.find(pool => pool.poolId === selectedPoolId);

    if (selectedPool) {
      setCurrentPool([selectedPool]);
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
          (!showAll && ledgerPoolsLoading) ||
          (!showAll && !pools.length) ? (
            <Box flex={1} py={3} alignItems="center" justifyContent="center">
              <BigSpinner size={35} />
            </Box>
          ) : (
            <ScrollLoadingList
              data={
                showAll
                  ? [
                      currentPool[0],
                      ...defaultPool.filter(p => p !== currentPool[0]),
                      ...pools.filter(
                        p =>
                          p &&
                          !poolIdsToFilterFromAllPools.includes(p.poolId) &&
                          p !== currentPool[0],
                      ),
                    ]
                  : currentPool
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
        {LEDGER_POOL_IDS.length ? (
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
