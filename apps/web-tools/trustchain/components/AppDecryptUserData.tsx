import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createQRCodeHostInstance } from "@ledgerhq/trustchain/qrcode/index";
import { crypto } from "@ledgerhq/hw-trustchain";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import styled from "styled-components";
import { Tooltip } from "react-tooltip";
import { JWT, MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { getInitialStore } from "@ledgerhq/trustchain/store";
import { Actionable, RenderActionable } from "./Actionable";
import QRCode from "./QRCode";
import useEnv from "../useEnv";
import Expand from "./Expand";
import { getSdk } from "@ledgerhq/trustchain";
import { DisplayName, IdentityManager } from "./IdentityManager";
import { AppQRCodeCandidate } from "./AppQRCodeCandidate";
import { Input } from "./Input";
import { SDKContext, defaultContext, useSDK } from "../context";

export function AppDecryptUserData({ trustchain }: { trustchain: Trustchain | null }) {
  const [input, setInput] = useState<string | null>(null);
  const [output, setOutput] = useState<{ input: string } | null>(null);
  const sdk = useSDK();

  const action = useCallback(
    (trustchain: Trustchain, input: string) =>
      sdk.decryptUserData(trustchain, crypto.from_hex(input)).then(obj => obj as { input: string }),
    [sdk],
  );

  const valueDisplay = useCallback((output: { input: string }) => <code>{output.input}</code>, []);

  return (
    <Actionable
      buttonTitle="sdk.decryptUserData"
      inputs={trustchain && input ? [trustchain, input] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={output}
      setValue={setOutput}
      buttonProps={{
        "data-tooltip-id": "tooltip",
        "data-tooltip-content":
          "decrypts a message with the current private key secured by the trustchain",
      }}
    >
      <Input
        placeholder="hex message to decrypt"
        type="text"
        value={input || ""}
        onChange={e => setInput(e.target.value)}
      />
    </Actionable>
  );
}
