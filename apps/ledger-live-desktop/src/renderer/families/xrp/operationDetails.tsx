import React from "react";
import { Account } from "@ledgerhq/types-live";
import { XrpOperation } from "@ledgerhq/live-common/families/xrp/types";
import { Trans } from "react-i18next";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import { OperationDetailsExtraProps } from "../types";

function OperationDetailsExtra({
  operation: { extra },
}: OperationDetailsExtraProps<Account, XrpOperation>) {
  const memo = extra?.memo;

  if (!memo) return null;

  return (
    <OpDetailsSection>
      <OpDetailsTitle>
        <Trans i18nKey="operationDetails.extra.memo" defaults="memo" />
      </OpDetailsTitle>
      <OpDetailsData>
        <Ellipsis>{memo}</Ellipsis>
      </OpDetailsData>
    </OpDetailsSection>
  );
}

export default {
  OperationDetailsExtra,
};
