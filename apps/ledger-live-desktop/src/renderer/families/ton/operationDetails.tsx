import { TonOperation } from "@ledgerhq/live-common/families/ton/types";
import React from "react";
import { Trans } from "react-i18next";
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";

type OperationDetailsExtraProps = {
  operation: TonOperation;
};

const OperationDetailsExtra = ({ operation }: OperationDetailsExtraProps) => {
  const { extra } = operation;
  return !extra.comment.text ? null : (
    <OpDetailsSection key={extra.comment.text}>
      <OpDetailsTitle>
        <Trans i18nKey={`families.ton.comment`} />
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
