import React from "react";
import { getMainAccount, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { getOperationAmountNumber } from "@ledgerhq/live-common/operation";
import { getMarketColor } from "~/renderer/styles/helpers";
import type { AddressCellProps, ConfirmationCellProps } from "~/renderer/families/types";
import Box from "~/renderer/components/Box";
import { AleoOperation } from "@ledgerhq/live-common/lib-es/families/aleo/types";
import ConfirmationCheck from "~/renderer/components/OperationsList/ConfirmationCheck";
import styled from "styled-components";
import { OperationType } from "@ledgerhq/types-live";

// const OperationDetailsExtra = ({
//   operation,
// }: OperationDetailsExtraProps<HederaAccount, HederaOperation>) => {
//   const extra = isValidExtra(operation.extra) ? operation.extra : null;

//   if (!extra) {
//     return null;
//   }

//   const extraFields = getOperationDetailsExtraFields(extra);

//   return (
//     <>
//       {extraFields.map(item => (
//         <OpDetailsSection key={item.key}>
//           <OpDetailsTitle>
//             <Trans i18nKey={`operationDetails.extra.${item.key}`} defaults={item.key} />
//           </OpDetailsTitle>
//           <OpDetailsData>
//             <Ellipsis>{item.value}</Ellipsis>
//           </OpDetailsData>
//         </OpDetailsSection>
//       ))}
//     </>
//   );
// };

const Cell = styled(Box).attrs(() => ({
  pl: 4,
  horizontal: true,
  alignItems: "center",
}))``;

const ConfirmationCell = ({
  // account,
  // parentAccount,
  isConfirmed,
  t,
  operation,
}: ConfirmationCellProps<AleoOperation>) => {
  // const mainAccount = getMainAccount(account, parentAccount);
  // const currency = getAccountCurrency(mainAccount);
  const amount = getOperationAmountNumber(operation);
  const isNegative = amount.isNegative();
  const marketColor = getMarketColor({
    isNegative,
  });

  return (
    <Cell alignItems="center" justifyContent="flex-start">
      <ConfirmationCheck
        type={operation.type}
        isConfirmed={isConfirmed}
        marketColor={marketColor}
        hasFailed={operation.hasFailed}
        t={t}
      />
      <ConfirmationCheck
        type={operation.type}
        isConfirmed={isConfirmed}
        marketColor={marketColor}
        hasFailed={operation.hasFailed}
        t={t}
      />
    </Cell>
  );
};

const AddressCell = ({ operation }: AddressCellProps<AleoOperation>) => {
  return (
    // FIXME: replace with custom cell imp
    <Cell flex="1" justifyContent="space-between" gap={3}>
      <Box color="neutral.c80" ff="Inter" fontSize={3}>
        {operation.hash}
      </Box>
      <Box color="neutral.c80" ff="Inter" fontSize={3}>
        asdasdasdasd
      </Box>
    </Cell>
  );
};

const addressCell = {
  IN: AddressCell,
} satisfies Partial<Record<OperationType, unknown>>;

export default {
  addressCell,
};
