import React from "react";
import { useTranslation } from "react-i18next";
import {
  readOperationExtra,
  type ConcordiumOperation,
} from "@ledgerhq/live-common/families/concordium/types";
import { Account } from "@ledgerhq/types-live";
import Ellipsis from "~/renderer/components/Ellipsis";
import {
  OpDetailsData,
  OpDetailsSection,
  OpDetailsTitle,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { OperationDetailsExtraProps } from "../types";

/**
 * Replaces the generic renderer, which titles each `extra` key with
 * `operationDetails.extra.<key>` and prints the raw value — readable for a memo,
 * but it would put a bare `pltRejectCode` slug on screen. A field added to
 * `extra` later has to be handled here to render at all.
 *
 * A reject cause only exists once the transfer has settled and been charged for,
 * so history is the only place it can be told; `hasFailed` alone does not say
 * why.
 */
const OperationDetailsExtra = ({
  operation,
}: OperationDetailsExtraProps<Account, ConcordiumOperation>) => {
  const { t } = useTranslation();
  const { memo, pltRejectCode } = readOperationExtra(operation.extra);

  if (!memo && !pltRejectCode) return null;

  return (
    <>
      {memo ? (
        <OpDetailsSection>
          <OpDetailsTitle>{t("operationDetails.extra.memo")}</OpDetailsTitle>
          <OpDetailsData>
            <Ellipsis>{memo}</Ellipsis>
          </OpDetailsData>
        </OpDetailsSection>
      ) : null}
      {pltRejectCode ? (
        <OpDetailsSection>
          <OpDetailsTitle>{t("operationDetails.extra.pltReject.title")}</OpDetailsTitle>
          <OpDetailsData>{t(`operationDetails.extra.pltReject.${pltRejectCode}`)}</OpDetailsData>
        </OpDetailsSection>
      ) : null}
    </>
  );
};

export default {
  OperationDetailsExtra,
};
