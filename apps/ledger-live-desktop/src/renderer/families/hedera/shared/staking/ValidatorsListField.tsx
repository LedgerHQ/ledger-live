import React, { useState, useCallback } from "react";
import { Trans } from "react-i18next";
import styled from "styled-components";
import { Account } from "@ledgerhq/types-live";
import { useHederaValidators } from "@ledgerhq/live-common/families/hedera/react";
import { HederaValidator } from "@ledgerhq/live-common/families/hedera/types";
import { getDefaultValidator } from "@ledgerhq/live-common/families/hedera/logic";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import ValidatorSearchInput, {
  NoResultPlaceholder,
} from "~/renderer/components/Delegation/ValidatorSearchInput";
import IconAngleDown from "~/renderer/icons/AngleDown";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import ValidatorListItem from "./ValidatorListItem";

type Props = {
  account: Account;
  selectedValidatorAddress: string | null;
  onChangeValidator: (validator: HederaValidator) => void;
};

const ValidatorsListField = ({ account, selectedValidatorAddress, onChangeValidator }: Props) => {
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const unit = useAccountUnit(account);
  const validators = useHederaValidators(account.currency, search);

  const defaultValidator = getDefaultValidator(validators);
  const selectedValidator = validators.find(v => v.address === selectedValidatorAddress);
  const value = selectedValidator ?? defaultValidator;

  const renderItem = (validator: HederaValidator) => {
    return (
      <ValidatorListItem
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
            data={showAll ? validators : value ? [value] : []}
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

export default ValidatorsListField;
