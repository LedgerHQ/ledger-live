// @flow

import React, { Fragment } from "react";
import { Trans } from "react-i18next";

import { HeaderWrapper } from "~/renderer/components/TableContainer";
import { TableLine } from "~/renderer/families/elrond/blocks/Delegation";
import Delegation from "~/renderer/families/elrond/components/Delegations/components/Delegation";

import type { Account as AccountType } from "@ledgerhq/types-live";
import type { DelegationType, ValidatorType } from "~/renderer/families/elrond/types";

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
          {...{ delegations, validators, account, ...delegation }}
        />
      ))}
    </Fragment>
  );
};

export default Delegations;
