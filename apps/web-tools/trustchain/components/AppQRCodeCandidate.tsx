import React, { useCallback, useState } from "react";
import { createQRCodeCandidateInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError, NoTrustchainInitialized } from "@ledgerhq/trustchain/errors";
import { MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { Actionable } from "./Actionable";
import { memberNameForPubKey } from "./IdentityManager";
import { Input } from "./Input";
import { useTrustchainSDK } from "../context";

export function AppQRCodeCandidate({
  memberCredentials,
  setTrustchain,
  trustchain,
}: {
  memberCredentials: MemberCredentials | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
  trustchain: Trustchain | null;
}) {
  const sdk = useTrustchainSDK();
  const [scannedUrl, setScannedUrl] = useState<string | null>(null);
  const [input, setInput] = useState<string | null>(null);
  const [digits, setDigits] = useState<number | null>(null);
  const [inputCallback, setInputCallback] = useState<((input: string) => void) | null>(null);

  const onRequestQRCodeInput = useCallback(
    (config: { digits: number }, callback: (input: string) => void) => {
      setDigits(config.digits);
      setInputCallback(() => callback);
    },
    [],
  );

  const handleStart = useCallback(
    (scannedUrl: string, memberCredentials: MemberCredentials) => {
      return createQRCodeCandidateInstance({
        memberCredentials,
        scannedUrl,
        memberName: memberNameForPubKey(memberCredentials.pubkey),
        onRequestQRCodeInput,
        addMember: async member => {
          if (trustchain) {
            await sdk.addMember(trustchain, memberCredentials, member);
            return trustchain;
          }
          throw new NoTrustchainInitialized();
        },
        initialTrustchainId: trustchain?.rootId,
      })
        .then(trustchain => {
          if (trustchain) {
            setTrustchain(trustchain);
          }
          return true;
        })
        .catch(e => {
          // there can be various errors, InvalidDigitsError is one of them that can be handled
          if (e instanceof InvalidDigitsError) {
            alert("Invalid digits");
            return;
          }
          throw e;
        })
        .finally(() => {
          // at this stage, everything is done, we can reset the state
          setScannedUrl(null);
          setInput(null);
          setDigits(null);
          setInputCallback(null);
        });
    },
    [onRequestQRCodeInput, sdk, setTrustchain, trustchain],
  );

  const handleSendDigits = useCallback(
    (inputCallback: (_: string) => void, input: string) => (inputCallback(input), true),
    [],
  );

  return (
    <div>
      <Actionable
        buttonTitle="Set QR Code Host URL"
        inputs={scannedUrl && memberCredentials ? [scannedUrl, memberCredentials] : null}
        action={handleStart}
        buttonProps={{
          "data-tooltip-id": "tooltip",
          "data-tooltip-content":
            "starts the flow to join a trustchain by scanning a QR code from a host",
        }}
      >
        <Input
          placeholder="QR Code value (url)"
          type="text"
          value={scannedUrl || ""}
          onChange={e => setScannedUrl(e.target.value)}
        />
      </Actionable>

      {digits ? (
        <Actionable
          buttonTitle="Send Digits"
          inputs={inputCallback && input && digits === input.length ? [inputCallback, input] : null}
          action={handleSendDigits}
          buttonProps={{
            "data-tooltip-id": "tooltip",
            "data-tooltip-content": "send the digits to the host to complete the QR Code flow",
          }}
        >
          <Input
            type="text"
            maxLength={digits}
            value={input || ""}
            onChange={e => setInput(e.target.value)}
          />
        </Actionable>
      ) : null}
    </div>
  );
}
