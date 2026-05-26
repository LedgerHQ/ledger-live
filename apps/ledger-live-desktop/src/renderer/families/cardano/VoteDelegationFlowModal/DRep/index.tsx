import { useCardanoFamilyDReps } from "@ledgerhq/live-common/families/cardano/react";
import { DRep } from "@ledgerhq/coin-cardano/api/api-types";

import { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { Account } from "@ledgerhq/types-live";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import BigSpinner from "~/renderer/components/BigSpinner";
import Box from "~/renderer/components/Box";
import DRepSearchInput, { NoResultPlaceholder } from "./components/DRepSearchInput";
import ScrollLoadingList from "../ScrollLoadingList";
import DRepRow from "./components/DRepRow";
import DRepListHeader from "./components/DRepListHeader";
type Props = {
  account: Account;
  status: TransactionStatus;
  onChangeDRep: (a: DRep) => void;
  selectedDRepHex: string;
};

export function putUserDRepAtFirstPositionInDReps(dReps: DRep[], firstDRepHex: string): DRep[] {
  const index = dReps.findIndex(
    dRep => (dRep.hex || "").toLowerCase() === (firstDRepHex || "").toLowerCase(),
  );
  if (index === -1) {
    return dReps;
  }

  const dRep = { ...dReps[index] };
  return [dRep, ...dReps.filter((_, i) => i !== index)];
}

const DRepField = ({ account, onChangeDRep, selectedDRepHex }: Props) => {
  const [userAndLedgerDReps, setUserAndLedgerDReps] = useState<Array<DRep>>([]);
  const [userAndLedgerDRepsLoading, setUserAndLedgerDRepsLoading] = useState(false);
  const { dReps, searchQuery, setSearchQuery, onScrollEndReached, isSearching, isPaginating } =
    useCardanoFamilyDReps(account.currency);

  useEffect(() => {
    setUserAndLedgerDRepsLoading(true);
    setUserAndLedgerDReps(putUserDRepAtFirstPositionInDReps(dReps, selectedDRepHex));
    setUserAndLedgerDRepsLoading(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dReps]);

  useEffect(() => {
    const selectedDRep =
      dReps.find(
        (d: { hex: string }) => (d.hex || "").toLowerCase() === (selectedDRepHex || "").toLowerCase(),
      ) ||
      userAndLedgerDReps.find(
        dRep => (dRep.hex || "").toLowerCase() === (selectedDRepHex || "").toLowerCase(),
      );

    if (selectedDRep) {
      if (
        dReps.some(
          (d: { hex: string }) => (d.hex || "").toLowerCase() === (selectedDRepHex || "").toLowerCase(),
        )
      ) {
        onChangeDRep(selectedDRep);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDRepHex]);

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(evt.target.value),
    [setSearchQuery],
  );
  const renderItem = (dRep: DRep, dRepIdx: number) => {
    return (
      <DRepRow
        currency={account.currency}
        key={dRepIdx + dRep.hex}
        dRep={dRep}
        active={(selectedDRepHex || "").toLowerCase() === (dRep.hex || "").toLowerCase()}
        onClick={onChangeDRep}
      />
    );
  };

  return (
    <>
      {<DRepSearchInput noMargin={true} search={searchQuery} onSearch={onSearch} />}
      <DRepContainer>
        <Box p={1} data-testid="dRep-list">
          {isSearching || userAndLedgerDRepsLoading || (!dReps.length && !searchQuery) ? (
            <Box flex={1} py={3} alignItems="center" justifyContent="center">
              <BigSpinner size={35} />
            </Box>
          ) : (
            <Box>
              {userAndLedgerDReps.length > 0 && <DRepListHeader />}

              <ScrollLoadingList
                data={[...userAndLedgerDReps]}
                style={{
                  flex: "1 0 256px",
                  marginBottom: 0,
                  paddingLeft: 0,
                }}
                renderItem={renderItem}
                noResultPlaceholder={
                  userAndLedgerDReps.length <= 0 &&
                  !isSearching && <NoResultPlaceholder search={searchQuery} />
                }
                fetchPoolsFromNextPage={onScrollEndReached}
                search={searchQuery}
                isPaginating={isPaginating}
              />
            </Box>
          )}
        </Box>
      </DRepContainer>
    </>
  );
};

const DRepContainer = styled(Box)`
  border: 1px solid ${p => p.theme.colors.neutral.c40};
  border-radius: 4px;
`;

export default DRepField;
