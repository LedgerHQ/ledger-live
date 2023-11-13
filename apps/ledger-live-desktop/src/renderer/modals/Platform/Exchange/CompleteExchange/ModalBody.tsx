import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Exchange, ExchangeSwap } from "@ledgerhq/live-common/exchange/platform/types";
import { Exchange as SwapExchange } from "@ledgerhq/live-common/exchange/swap/types";
import { setBroadcastTransaction } from "@ledgerhq/live-common/exchange/swap/setBroadcastTransaction";
import { getUpdateAccountWithUpdaterParams } from "@ledgerhq/live-common/exchange/swap/getUpdateAccountWithUpdaterParams";
import { Operation, SignedOperation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { ModalBody } from "~/renderer/components/Modal";
import Box from "~/renderer/components/Box";
import { useBroadcast } from "~/renderer/hooks/useBroadcast";
import { BodyContent } from "./BodyContent";
import { getMagnitudeAwareRate } from "@ledgerhq/live-common/exchange/swap/webApp/index";
import LogicContent, { Data } from "./Body";

const Body = ({ data, onClose }: { data: Data; onClose?: () => void | undefined }) => {
  const { onCancel } = data;

  return (
    <ModalBody
      onClose={() => {
        onCancel(new Error("Interrupted by user"));
        onClose?.();
      }}
      render={() => <LogicContent data={data} onClose={onClose} />}
    />
  );
};

export default Body;
