import { KadenaOperation } from "@ledgerhq/live-common/families/kadena/types";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { OperationDetailsExtraProps } from "../types";

const OperationDetailsExtra = ({
  operation,
}: OperationDetailsExtraProps<Account, KadenaOperation>) => {
  return (
    <>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey={"operationDetails.extra.senderChainId"} />
        </OpDetailsTitle>
        <OpDetailsData>{operation.extra.senderChainId}</OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey={"operationDetails.extra.receiverChainId"} />
        </OpDetailsTitle>
        <OpDetailsData>{operation.extra.receiverChainId}</OpDetailsData>
      </OpDetailsSection>
      {operation.extra.receiverChainId !== operation.extra.senderChainId &&
      operation.type === "OUT" ? (
        <OpDetailsSection>
          <OpDetailsData
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}
          >
            <Trans i18nKey="errors.KadenaCrossChainTransfer.title" />
          </OpDetailsData>
        </OpDetailsSection>
      ) : null}
    </>
  );
};

export default {
  OperationDetailsExtra,
};
