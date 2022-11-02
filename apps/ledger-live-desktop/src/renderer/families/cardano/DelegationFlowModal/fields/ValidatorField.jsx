// @flow
import React, { useState, useCallback, useMemo, useEffect } from "react";
import type { TFunction } from "react-i18next";

import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { useLedgerFirstShuffledValidatorsCosmos } from "@ledgerhq/live-common/families/cosmos/react";

import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "../ScrollLoadingList";
import { Trans } from "react-i18next";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorRow from "./ValidatorRow";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";
import type { Account } from "@ledgerhq/types-live";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import type { StakePool } from "@ledgerhq/live-common/families/cardano/api/api-types";
import { fetchPoolList } from "@ledgerhq/live-common/families/cardano/api/getPools";

import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";

type Props = {
  t: TFunction,
  account: Account,
  status: TransactionStatus,
  delegation: StakePool,
  onChangeValidator: ({ address: string }) => void,
  selectedPoolId: string,
};

const ValidatorField = ({
  account,
  status,
  t,
  delegation,
  onChangeValidator,
  selectedPoolId,
}: Props) => {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [pageNo, setPageNo] = useState(1);
  const [totalPools, setTotalPools] = useState(0);
  const unit = getAccountUnit(account);

  const ledgerPools: Array<StakePool> = [
    {
      poolId: "a57cbcb8ecdf24f469928da924b5bc6e4cbc3b57859577211a0daf6f",
      name: "Demo",
      ticker: "LEDGR",
      website: "https://www.ledger.com/ledger-live",
      margin: "5",
      cost: "340000000",
      pledge: "",
      retiredEpoch: undefined,
    },
  ];

  useEffect(() => {
    const ledgerPoolIds = ledgerPools.map(l => l.poolId);
    fetchPoolList(account.currency, search, pageNo, 50).then(apiRes => {
      setTotalPools(apiRes.count);
      setValidators([
        ...validators,
        ...apiRes.pools.filter(p => !!p.name).filter(p => !ledgerPoolIds.includes(p.poolId)),
      ]);
    });
  }, [pageNo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ledgerPoolIds = ledgerPools.map(l => l.poolId);

    fetchPoolList(account.currency, search, pageNo, 50).then(apiRes => {
      setTotalPools(apiRes.count);
      setValidators([
        ...apiRes.pools.filter(p => !!p.name).filter(p => !ledgerPoolIds.includes(p.poolId)),
      ]);
    });
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const [validators, setValidators] = useState([]);

  const onSearch = useCallback(evt => setSearch(evt.target.value), [setSearch]);

  const renderItem = (validator: StakePool, validatorIdx: number) => {
    return (
      <ValidatorRow
        currency={account.currency}
        key={validatorIdx + validator.poolId}
        pool={validator}
        unit={unit}
        active={selectedPoolId === validator.poolId || validator.poolId === delegation.poolId}
        onClick={onChangeValidator}
        disabled={validator.poolId === delegation.poolId}
      ></ValidatorRow>
    );
  };

  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1}>
          <ScrollLoadingList
            data={showAll ? validators : ledgerPools}
            style={{ flex: showAll ? "1 0 256px" : "1 0 64px", marginBottom: 0, paddingLeft: 0 }}
            renderItem={renderItem}
            noResultPlaceholder={null}
            setPageNo={setPageNo}
            pageNo={pageNo}
            totalPools={totalPools}
          />
        </Box>
        <SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
          <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
          </Text>
          <IconAngleDown size={16} />
        </SeeAllButton>
      </ValidatorsFieldContainer>
    </>
  );
};

const ValidatorsFieldContainer: ThemedComponent<{}> = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
`;

const SeeAllButton: ThemedComponent<{ expanded: boolean }> = styled.div`
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
