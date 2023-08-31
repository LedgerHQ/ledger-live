import React from "react";
import { Trans } from "react-i18next";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import { StacksOperation } from "@ledgerhq/live-common/families/stacks/types";

type OperationDetailsExtraProps = {
  operation: StacksOperation;
};

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  const { extra } = operation;
  return !extra.memo ? null : (
    <OpDetailsSection key={extra.memo}>
      <OpDetailsTitle>
        <Trans i18nKey={`operationDetails.extra.memo`} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Ellipsis>{extra.memo}</Ellipsis>
      </OpDetailsData>
    </OpDetailsSection>
  );
};

export default {
  OperationDetailsExtra,
};
