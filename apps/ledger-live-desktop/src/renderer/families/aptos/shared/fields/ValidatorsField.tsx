// import { useValidators } from "@ledgerhq/live-common/families/solana/react";
// import { ValidatorsAppValidator } from "@ledgerhq/live-common/families/solana/staking";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";

import React, { useState, useCallback, useEffect } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import Text from "~/renderer/components/Text";
import IconAngleDown from "~/renderer/icons/AngleDown";
// import ValidatorRow from "../components/ValidatorRow";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { AptosAPI } from "@ledgerhq/coin-aptos/api";
import ValidatorRow from "../components/ValidatorRow";

type Props = {
  account: AptosAccount;
  chosenVoteAccAddr: string | undefined | null;
  onChangeValidator: (v: { address: string }) => void;
};
// const ValidatorField = ({ account, onChangeValidator, chosenVoteAccAddr }: Props) => {
const ValidatorField = ({ account, onChangeValidator, chosenVoteAccAddr }: Props) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);

  const unit = useAccountUnit(account);

  const [list, setList] = useState<ValidatorsAppValidator[]>([]);

  useEffect(() => {
    const fetchList = async (): Promise<ValidatorsAppValidator[] | undefined> => {
      try {
        const api = new AptosAPI(account.currency.id);
        const delegators = await api.getStakingPool();

        setList(delegators);
      } catch (e) {
        console.error(e);

        return [];
      }
    };

    fetchList();
  }, [account.currency.id]);

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [setSearch],
  );

  type ValidatorsAppValidator = {
    activeStake: number;
    commission: number;
    totalScore: number;
    voteAccount: string;
    name?: string | undefined;
    avatarUrl?: string | undefined;
    wwwUrl?: string | undefined;
  };

  const renderItem = (validator: ValidatorsAppValidator) => {
    const key =
      typeof validator.voteAccount === "string" ? validator.voteAccount : Math.random().toString();

    return (
      <ValidatorRow
        currency={account.currency}
        active={chosenVoteAccAddr === validator.voteAccount}
        onClick={onChangeValidator}
        key={key}
        validator={validator}
        unit={unit}
      />
    );
  };

  const uniqueList = Array.from(new Map(list.map(v => [v.voteAccount, v])).values());

  const filteredList = uniqueList.filter(validator => {
    if (!search) return true;

    const voteAccount =
      typeof validator.voteAccount === "string" ? validator.voteAccount.toLowerCase() : "";
    const name = typeof validator.name === "string" ? validator.name.toLowerCase() : "";

    const searchLower = search.toLowerCase();
    return voteAccount.includes(searchLower) || name.includes(searchLower);
  });

  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="validator-list">
          <ScrollLoadingList
            data={filteredList}
            style={{
              flex: showAll ? "1 0 240px" : "1 0 126px",
              marginBottom: 0,
              paddingLeft: 0,
            }}
            renderItem={renderItem}
            noResultPlaceholder={
              filteredList.length <= 0 &&
              search.length > 0 && <NoResultPlaceholder search={search} />
            }
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
