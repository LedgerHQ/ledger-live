import { TooManyUtxosCritical, TooManyUtxosWarning } from "@ledgerhq/coin-canton";
import { CantonAccount, TransactionStatus } from "@ledgerhq/live-common/families/canton/types";
import { sendRecipientCanNext } from "@ledgerhq/live-common/families/hedera/utils";
import { urls } from "~/utils/urls";
import Alert from "~/components/Alert";
import type { Account } from "@ledgerhq/types-live";
import React, { useEffect, useState } from "react";
import { Trans } from "react-i18next";
import { component as TooManyUtxosModal } from "./TooManyUtxosModal";

function StepRecipientCustomAlert({
  status,
  account,
}: Readonly<{
  status: TransactionStatus;
  account?: Account;
}>) {
  const cantonAccount = account as CantonAccount;
  const [showTooManyUtxosModal, setShowTooManyUtxosModal] = useState(false);

  const tooManyUtxosCritical = status?.warnings?.tooManyUtxos instanceof TooManyUtxosCritical;
  const tooManyUtxosWarning = status?.warnings?.tooManyUtxos instanceof TooManyUtxosWarning;

  useEffect(() => {
    if (tooManyUtxosCritical) {
      setShowTooManyUtxosModal(true);
    }
  }, [tooManyUtxosCritical]);

  const handleCloseModal = () => {
    setShowTooManyUtxosModal(false);
  };

  return (
    <>
      {tooManyUtxosWarning && (
        <Alert type="warning" learnMoreUrl={urls.canton.learnMore} learnMoreKey="common.learnMore">
          <Trans i18nKey="canton.tooManyUtxos.warning" />
        </Alert>
      )}

      {account && (
        <TooManyUtxosModal
          isOpened={showTooManyUtxosModal}
          onClose={handleCloseModal}
          account={cantonAccount}
        />
      )}
    </>
  );
}

export default { sendRecipientCanNext, StepRecipientCustomAlert };
