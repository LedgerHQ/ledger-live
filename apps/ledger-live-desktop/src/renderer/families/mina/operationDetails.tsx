import React from "react";
import { Trans } from "react-i18next";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import { MinaOperation } from "@ledgerhq/live-common/families/mina/types";

type OperationDetailsExtraProps = {
  operation: MinaOperation;
};

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  const { extra } = operation;
  const sections = [];
  if (extra.memo) {
    sections.push(
      <OpDetailsSection key={extra.memo}>
        <OpDetailsTitle>
          <Trans i18nKey={`operationDetails.extra.memo`} />
        </OpDetailsTitle>
        <OpDetailsData>
          <Ellipsis>{extra.memo}</Ellipsis>
        </OpDetailsData>
      </OpDetailsSection>,
    );
  }

  if (extra.accountCreationFee !== "0") {
    sections.push(
      <OpDetailsSection key={extra.accountCreationFee}>
        <OpDetailsTitle>
          <Trans i18nKey={`operationDetails.extra.accountCreationFee`} />
        </OpDetailsTitle>
        <OpDetailsData>{extra.accountCreationFee}</OpDetailsData>
      </OpDetailsSection>,
    );
  }

  return sections;
};

export default {
  OperationDetailsExtra,
};
