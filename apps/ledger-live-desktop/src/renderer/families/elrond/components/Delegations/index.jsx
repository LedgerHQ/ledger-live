// @flow

import React, { Fragment } from "react";
import { Trans } from "react-i18next";
import type { Account as AccountType } from "@ledgerhq/types-live";

import { HeaderWrapper } from "~/renderer/components/TableContainer";
import { TableLine } from "~/renderer/families/elrond/blocks/Delegation";
import type { DelegationType, ValidatorType } from "~/renderer/families/elrond/types";
import Delegation from "~/renderer/families/elrond/components/Delegations/components/Delegation";

interface DelegationsType {
  delegations: Array<DelegationType>;
  validators: Array<ValidatorType>;
  account: AccountType;
}

const Delegations = ({ delegations, validators, account }: DelegationsType) => {
  const columns = [
    "delegation.validator",
    "delegation.status",
    "delegation.delegated",
    "delegation.rewards",
  ];

  return (
    <Fragment>
      <HeaderWrapper>
        {columns.map(column => (
          <TableLine key={column}>
            <Trans i18nKey={column} />
          </TableLine>
        ))}
        <TableLine />
      </HeaderWrapper>

      {delegations.map(delegation => (
        <Delegation
          key={`delegation-${delegation.contract}`}
          delegations={delegations}
          validators={validators}
          account={account}
          {...delegation}
        />
      ))}
    </Fragment>
  );
};

export default Delegations;
