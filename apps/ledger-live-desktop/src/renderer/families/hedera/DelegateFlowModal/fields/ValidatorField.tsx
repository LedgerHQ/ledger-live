import React, { useState, useCallback } from "react";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import { Trans } from "react-i18next";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorRow from "../../shared/components/ValidatorRow";
import { Account } from "@ledgerhq/types-live";
import { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type Props = {
  account: Account;
  selectedValidatorAddress: string | null;
  onChangeValidator: (validator: HederaValidator) => void;
  validators?: HederaValidator;
};

const ValidatorField = ({ account, selectedValidatorAddress, onChangeValidator }: Props) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const unit = useAccountUnit(account);
  const validators = useHederaValidators(account.currency, search);

  console.log("validators", validators);

  const renderItem = (validator: HederaValidator) => {
    return (
      <ValidatorRow
        currency={account.currency}
        key={validator.address}
        validator={validator}
        unit={unit}
        active={selectedValidatorAddress === validator.address}
        onClick={onChangeValidator}
      />
    );
  };

  const onSearch = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value),
    [setSearch],
  );

  return (
    <>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}
      <ValidatorsFieldContainer>
        <Box p={1} data-testid="validator-list">
          <ScrollLoadingList
            data={
              showAll
                ? validators
                : [validators.find(v => v.address === selectedValidatorAddress) || validators[0]]
            }
            style={{
              flex: showAll ? "1 0 256px" : "1 0 64px",
              marginBottom: 0,
              paddingLeft: 0,
            }}
            renderItem={renderItem}
            noResultPlaceholder={
              validators.length <= 0 && search.length > 0 && <NoResultPlaceholder search={search} />
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
