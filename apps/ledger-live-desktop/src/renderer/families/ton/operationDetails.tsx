import React from "react";
import { Trans } from "react-i18next";
import {
  OpDetailsTitle,
  OpDetailsData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import Ellipsis from "~/renderer/components/Ellipsis";
import { TonOperation } from "@ledgerhq/live-common/families/ton/types";

type OperationDetailsExtraProps = {
  operation: TonOperation;
};

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  const { extra } = operation;
  return !extra.comment.text ? null : (
    <OpDetailsSection key={extra.comment.text}>
      <OpDetailsTitle>
        <Trans i18nKey={`operationDetails.extra.comment`} />
      </OpDetailsTitle>
      <OpDetailsData>
        <Ellipsis>{extra.comment.text}</Ellipsis>
      </OpDetailsData>
    </OpDetailsSection>
  );
};

export default {
  OperationDetailsExtra,
};
