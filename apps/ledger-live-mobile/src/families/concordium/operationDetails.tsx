import React from "react";
import {
  readOperationExtra,
  type ConcordiumOperation,
} from "@ledgerhq/live-common/families/concordium/types";
import { useTranslation } from "~/context/Locale";
import Section from "~/screens/OperationDetails/Section";

type Props = {
  operation: ConcordiumOperation;
};

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
function OperationDetailsExtra({ operation }: Props) {
  const { t } = useTranslation();
  const { memo, pltRejectCode } = readOperationExtra(operation.extra);

  if (!memo && !pltRejectCode) return null;

  return (
    <>
      {memo ? <Section title={t("operationDetails.extra.memo")} value={memo} /> : null}
      {pltRejectCode ? (
        <Section
          title={t("operationDetails.extra.pltReject.title")}
          value={t(`operationDetails.extra.pltReject.${pltRejectCode}`)}
        />
      ) : null}
    </>
  );
}

export default {
  OperationDetailsExtra,
};
