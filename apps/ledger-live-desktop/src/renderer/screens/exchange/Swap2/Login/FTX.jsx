// @flow

import React, { useRef, useMemo } from "react";

import type { FTXProviders } from "@ledgerhq/live-common/exchange/swap/utils/index";
import { getFTXURL } from "@ledgerhq/live-common/exchange/swap/utils/index";

import SwapConnectWidget from "../SwapConnectWidget";

type Props = { onClose: Function, provider: FTXProviders };

const FTXLogin = ({ onClose, provider }: Props) => {
  const url = useMemo(() => getFTXURL({ type: "login", provider }), [provider]);

  const webviewRef = useRef(null);

  return <SwapConnectWidget provider={provider} onClose={onClose} url={url} ref={webviewRef} />;
};

export default FTXLogin;
