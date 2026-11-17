import React from "react";
import { Trans } from "react-i18next";
import type { AccountLike } from "@ledgerhq/types-live";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import Alert from "~/renderer/components/Alert";
import type { StepProps } from "~/renderer/modals/Receive/Body";
import { getXrpResources, hasTokenStandardEnabled } from "./utils";

type Props = StepProps & { account: AccountLike };

const StepReceiveAccountCustomAlert = ({ account, parentAccount, closeModal }: Props) => {
  const dispatch = useDispatch();

  const mainAccount = getMainAccount(account, parentAccount);
  if (!hasTokenStandardEnabled(mainAccount)) return null;

  const isTokenAccount = account.type === "TokenAccount";
  if (getXrpResources(account)) return null;

  const onAddToken = () => {
    closeModal();
    dispatch(
      openModal("MODAL_XRP_ADD_TOKEN", {
        account: mainAccount,
        ...(isTokenAccount && { token: account.token }),
      }),
    );
  };

  return (
    <Alert
      type={isTokenAccount ? "warning" : "primary"}
      mt={3}
      learnMoreLabel={<Trans i18nKey="xrp.receive.addToken" />}
      learnMoreIsInternal
      onLearnMore={onAddToken}
      data-testid="xrp-receive-add-token-alert"
    >
      {isTokenAccount ? (
        <Trans i18nKey="xrp.receive.tokenNotHeld" values={{ token: account.token.name }} />
      ) : (
        <Trans i18nKey="xrp.receive.addTokenFirst" />
      )}
    </Alert>
  );
};

export default StepReceiveAccountCustomAlert;
