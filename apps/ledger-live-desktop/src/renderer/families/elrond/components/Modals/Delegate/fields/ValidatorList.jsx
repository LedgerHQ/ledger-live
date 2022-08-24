// @flow

import React, { useState, useMemo, Fragment, useCallback } from "react";
import { getAccountUnit } from "@ledgerhq/live-common/account/index";
import { Trans } from "react-i18next";
import { BigNumber } from "bignumber.js";
import styled from "styled-components";

import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import ScrollLoadingList from "~/renderer/components/ScrollLoadingList";
import IconAngleDown from "~/renderer/icons/AngleDown";
import ValidatorSearchInput from "~/renderer/components/Delegation/ValidatorSearchInput";

import { constants } from "~/renderer/families/elrond/constants";
import { nominate } from "~/renderer/families/elrond/helpers";

import ValidatorItem from "./ValidatorItem";

import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { ValidatorType } from "~/renderer/families/elrond/types";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

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

type ValidatorListType = {
  account: Account,
  validators: Array<ValidatorType>,
  onSelectValidator: (recipient: string) => void,
  transaction: Transaction,
};

const ValidatorList = (props: ValidatorListType) => {
  const { account, validators, onSelectValidator, transaction } = props;

  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");

  const unit = useMemo(() => getAccountUnit(account), [account]);
  const providers = useMemo(() => {
    const needle = search.toLowerCase();

    // Filter the providers such that they'll match the possible search criteria.
    const filter = (validator: ValidatorType) => {
      const [foundByContract, foundByName]: Array<boolean> = [
        validator.contract.toLowerCase().includes(needle),
        validator.identity.name ? validator.identity.name.toLowerCase().includes(needle) : false,
      ];

      return foundByName || foundByContract;
    };

    // Map the providers such that they'll be assigned the "disabled" key if conditions are met.
    const disable = (validator: ValidatorType) => {
      const [alpha, beta] = [validator.maxDelegationCap, validator.totalActiveStake];
      const delegative = alpha !== "0" && validator.withDelegationCap;
      const difference = new BigNumber(alpha).minus(beta);
      const minimum = nominate("1");

      return Object.assign(validator, {
        disabled: delegative && difference.isLessThan(minimum),
      });
    };

    // Sort the providers such that Figment by Ledger will always be first.
    const sort = (validator: ValidatorType) => (validator.contract === constants.figment ? -1 : 1);
    const items = validators.sort(sort).map(disable);

    return Boolean(search) ? items.filter(filter) : items;
  }, [validators, constants.figment, search]);

  const defaultValidator = useMemo(
    () =>
      providers.filter(provider =>
        Boolean(transaction.recipient)
          ? provider.contract === transaction.recipient
          : provider.contract === constants.figment,
      ),
    [search, providers, showAll],
  );

  const isActiveValidator = useCallback(
    (contract: string) =>
      Boolean(transaction.recipient)
        ? contract === transaction.recipient
        : contract === constants.figment,
    [transaction.recipient, constants.figment],
  );

  const renderItem = useCallback(
    props =>
      props ? (
        <ValidatorItem
          {...{
            ...props,
            account,
            unit,
            onSelectValidator,
            active: isActiveValidator(props ? props.contract : ""),
          }}
        />
      ) : null,
    [ValidatorItem, onSelectValidator, account, unit, isActiveValidator],
  );

  return (
    <Fragment>
      {showAll && (
        <ValidatorSearchInput
          noMargin={true}
          search={search}
          onSearch={event => setSearch(event.target.value)}
        />
      )}

      <ValidatorsFieldContainer>
        <Box p={1}>
          <ScrollLoadingList
            data={showAll ? providers : defaultValidator}
            style={{ flex: showAll ? "1 0 256px" : "1 0 64px", marginBottom: 0, paddingLeft: 0 }}
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
