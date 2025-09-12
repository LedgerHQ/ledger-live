import React from "react";
import { Trans } from "react-i18next";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { OperationDetailsExtraProps } from "../types";
import { Account, Operation } from "@ledgerhq/types-live";

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps<Account, Operation>) => {
  const memo = (operation.extra as { memo: string }).memo;

  if (!memo) return null;

  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey={"operationDetails.extra.memo"} />
      </OpDetailsTitle>
      <OpDetailsData>{memo}</OpDetailsData>
    </OpDetailsSection>
  );
};
export default {
  OperationDetailsExtra,
};
