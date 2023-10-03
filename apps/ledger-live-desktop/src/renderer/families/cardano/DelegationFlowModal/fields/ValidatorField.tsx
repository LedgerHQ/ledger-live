import React, { useState, useCallback, useEffect } from "react";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
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
import { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";
import { useCardanoFamilyPools } from "@ledgerhq/live-common/families/cardano/react";
import { fetchPoolDetails } from "@ledgerhq/live-common/families/cardano/api/getPools";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import { LEDGER_POOL_IDS } from "@ledgerhq/live-common/families/cardano/utils";
import { CardanoDelegation } from "@ledgerhq/live-common/families/cardano/types";
import BigSpinner from "~/renderer/components/BigSpinner";

type Props = {
  t: TFunction;
  account: Account;
  status: TransactionStatus;
  delegation?: CardanoDelegation;
  onChangeValidator: (a: StakePool) => void;
  selectedPoolId: string;
};

const ValidatorField = ({ account, delegation, onChangeValidator, selectedPoolId }: Props) => {
  const [ledgerPools, setLedgerPools] = useState<Array<StakePool>>([]);
  const unit = getAccountUnit(account);

  const [showAll, setShowAll] = useState(
    LEDGER_POOL_IDS.length === 0 ||
      (LEDGER_POOL_IDS.length === 1 && delegation?.poolId === LEDGER_POOL_IDS[0]),
  );

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
      fetchPoolDetails(account.currency, LEDGER_POOL_IDS)
        .then((apiRes: { pools: Array<StakePool> }) => {
          const filteredLedgerPools = apiRes.pools.filter(
            pool => pool.poolId !== delegation?.poolId,
          );
          if (filteredLedgerPools.length) {
            setLedgerPools(filteredLedgerPools);
            onChangeValidator(filteredLedgerPools[0]);
          }
        })
        .finally(() => {
          setLedgerPoolsLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = useCallback(evt => setSearchQuery(evt.target.value), [setSearchQuery]);
  const renderItem = (validator: StakePool, validatorIdx: number) => {
    return (
      <ValidatorRow
        currency={account.currency}
        key={validatorIdx + validator.poolId}
        pool={validator}
        unit={unit}
        active={selectedPoolId === validator.poolId || validator.poolId === delegation?.poolId}
        onClick={onChangeValidator}
      />
    );
  };

  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={searchQuery} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1}>
          {(showAll && isSearching) || (!showAll && ledgerPoolsLoading) ? (
            <Box flex={1} py={3} alignItems="center" justifyContent="center">
              <BigSpinner size={35} />
            </Box>
          ) : (
            <ScrollLoadingList
              data={
                showAll
                  ? pools.filter(p => !poolIdsToFilterFromAllPools.includes(p.poolId))
                  : ledgerPools
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
