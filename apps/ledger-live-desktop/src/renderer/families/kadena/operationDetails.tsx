import { KadenaOperation } from "@ledgerhq/live-common/families/kadena/types";
import { Account } from "@ledgerhq/types-live";
import React from "react";
import { Trans } from "react-i18next";
import LinkWithExternalIcon from "~/renderer/components/LinkWithExternalIcon";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { openURL } from "~/renderer/linking";
import { OperationDetailsExtraProps } from "../types";

const OperationDetailsExtra = ({
  operation,
}: OperationDetailsExtraProps<Account, KadenaOperation>) => {
  return (
    <>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey={"operationDetails.extra.receiverChainId"} />
        </OpDetailsTitle>
        <OpDetailsData>{operation.extra.receiverChainId}</OpDetailsData>
      </OpDetailsSection>
      <OpDetailsSection>
        <OpDetailsTitle>
          <Trans i18nKey={"operationDetails.extra.senderChainId"} />
        </OpDetailsTitle>
        <OpDetailsData>{operation.extra.senderChainId}</OpDetailsData>
      </OpDetailsSection>
      {operation.extra.receiverChainId !== operation.extra.senderChainId ? (
        <OpDetailsSection>
          <OpDetailsData
            style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}
          >
            <Trans i18nKey="send.steps.details.transferCrossChainWarning" />
            <LinkWithExternalIcon
              fontSize={4}
              onClick={() =>
                openURL(
                  `https://tools.kadena.io/transactions/cross-chain-transfer-finisher?reqKey=${operation.hash}`,
                )
              }
              label={<Trans i18nKey={"operationDetails.extra.finishCrossChainTransfer"} />}
            />
          </OpDetailsData>
        </OpDetailsSection>
      ) : null}
    </>
  );
};

export default {
  OperationDetailsExtra,
};
