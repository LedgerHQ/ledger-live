import React, { useState, useMemo, Fragment, useCallback } from "react";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { Trans } from "react-i18next";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";
import ValidatorItem, { ValidatorItemType } from "./ValidatorItem";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/elrond/constants";
import { useSearchValidators } from "@ledgerhq/live-common/families/elrond/react";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { ElrondProvider } from "@ledgerhq/live-common/families/elrond/types";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
const ValidatorsFieldContainer: ThemedComponent<{}> = styled(Box)`
  border: 1px solid ${p => p.theme.colors.palette.divider};
  border-radius: 4px;
`;
const SeeAllButton: ThemedComponent<{
  expanded: boolean;
}> = styled.div`
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
type Props = {
  account: Account;
  validators: Array<ElrondProvider>;
  onSelectValidator: (recipient: string) => void;
  transaction: Transaction;
};
const ValidatorList = (props: Props) => {
  const { account, validators, onSelectValidator, transaction } = props;
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const unit = useMemo(() => getAccountUnit(account), [account]);
  const providers = useSearchValidators(validators, search);
  const defaultValidator = useMemo(
    () =>
      providers.filter(provider =>
        transaction.recipient
          ? provider.contract === transaction.recipient
          : provider.contract === ELROND_LEDGER_VALIDATOR_ADDRESS,
      ),
    [providers, transaction.recipient],
  );
  const isActiveValidator = useCallback(
    (contract: string) =>
      transaction.recipient
        ? contract === transaction.recipient
        : contract === ELROND_LEDGER_VALIDATOR_ADDRESS,
    [transaction.recipient],
  );
  const renderItem = useCallback(
    (props: ValidatorItemType) =>
      props ? (
        <ValidatorItem
          unit={unit}
          account={account}
          onSelectValidator={onSelectValidator}
          active={isActiveValidator(props ? props.contract : "")}
          {...props}
        />
      ) : null,
    [onSelectValidator, account, unit, isActiveValidator],
  );
  const onSearch = useCallback(
    (event: SyntheticInputEvent<HTMLInputElement>) => setSearch(event.target.value),
    [],
  );
  return (
    <Fragment>
      {showAll && <ValidatorSearchInput noMargin={true} search={search} onSearch={onSearch} />}

      <ValidatorsFieldContainer>
        <Box p={1}>
          <ScrollLoadingList
            data={showAll ? providers : defaultValidator}
            style={{
              flex: showAll ? "1 0 256px" : "1 0 64px",
              marginBottom: 0,
              paddingLeft: 0,
            }}
            renderItem={renderItem}
            noResultPlaceholder={null}
          />
        </Box>

        <SeeAllButton expanded={showAll} onClick={() => setShowAll(shown => !shown)}>
          <Text color="wallet" ff="Inter|SemiBold" fontSize={4}>
            <Trans i18nKey={showAll ? "distribution.showLess" : "distribution.showAll"} />
          </Text>

          <IconAngleDown size={16} />
        </SeeAllButton>
      </ValidatorsFieldContainer>
    </Fragment>
  );
};
export default ValidatorList;
