import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { MinaAccount } from "@ledgerhq/live-common/families/mina/types";
import { TokenAccount } from "@ledgerhq/types-live";
import { openModal } from "~/renderer/actions/modals";
import TableContainer, { TableHeader } from "~/renderer/components/TableContainer";
import { Header } from "./Header";
import { Row } from "./Row";

const Delegation = ({ account }: { account: MinaAccount }) => {
  const dispatch = useDispatch();

  const onRedelegate = useCallback(() => {
    dispatch(openModal("MODAL_MINA_STAKE", { account }));
  }, [account, dispatch]);

  const onUndelegate = useCallback(() => {
    dispatch(openModal("MODAL_MINA_STAKE", { account, mode: "undelegate" }));
  }, [account, dispatch]);

  if (!account.resources?.stakingActive) return null;

  return (
    <TableContainer mb={6}>
      <TableHeader title={<Trans i18nKey="mina.delegation.listHeader" />} />
      <Header />
      <Row account={account} onRedelegate={onRedelegate} onUndelegate={onUndelegate} />
    </TableContainer>
  );
};

const Delegations = ({ account }: { account: MinaAccount | TokenAccount }) => {
  if (account.type !== "Account") return null;
  return <Delegation account={account} />;
};

export default Delegations;
