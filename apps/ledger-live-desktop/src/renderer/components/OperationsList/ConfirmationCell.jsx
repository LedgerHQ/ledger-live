// @flow

import React, { PureComponent } from "react";
import type { TFunction } from "react-i18next";
import styled from "styled-components";
import type { Account, Operation, AccountLike } from "@ledgerhq/types-live";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { getMarketColor } from "~/renderer/styles/helpers";

import Box from "~/renderer/components/Box";

import ConfirmationCheck from "./ConfirmationCheck";
import type { ThemedComponent } from "~/renderer/styles/StyleProvider";

import perFamilyOperationDetails from "~/renderer/generated/operationDetails";

const Cell: ThemedComponent<{}> = styled(Box).attrs(() => ({
  pl: 4,
  horizontal: true,
  alignItems: "center",
}))``;

type OwnProps = {
  account: AccountLike,
  parentAccount?: Account,
  t: TFunction,
  operation: Operation,
};

type Props = {
  ...OwnProps,
  confirmationsNb: number,
  isConfirmed: Boolean,
};

class ConfirmationCell extends PureComponent<Props> {
  render() {
    const { account, parentAccount, isConfirmed, t, operation } = this.props;
    const mainAccount = getMainAccount(account, parentAccount);
    const currency = getAccountCurrency(mainAccount);

    const amount = getOperationAmountNumber(operation);

    const isNegative = amount.isNegative();

    const marketColor = getMarketColor({ isNegative });

    // $FlowFixMe
    const specific = currency.family ? perFamilyOperationDetails[currency.family] : null;

    const SpecificConfirmationCell =
      specific && specific.confirmationCell ? specific.confirmationCell[operation.type] : null;

    return SpecificConfirmationCell ? (
      <SpecificConfirmationCell
        operation={operation}
        type={operation.type}
        isConfirmed={isConfirmed}
        marketColor={marketColor}
        hasFailed={operation.hasFailed}
        t={t}
      />
    ) : (
      <Cell alignItems="center" justifyContent="flex-start">
        <ConfirmationCheck
          type={operation.type}
          isConfirmed={isConfirmed}
          marketColor={marketColor}
          hasFailed={operation.hasFailed}
          t={t}
        />
      </Cell>
    );
  }
}

export default ConfirmationCell;
