import React, { useCallback, useState } from "react";
import { createQRCodeCandidateInstance } from "@ledgerhq/ledger-key-ring-protocol/qrcode/index";
import {
  InvalidDigitsError,
  NoTrustchainInitialized,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { TextInput } from "@ledgerhq/lumen-ui-react";
import { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { Actionable } from "./Actionable";
import { memberNameForPubKey } from "./IdentityManager";
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
          if (e instanceof InvalidDigitsError) {
            alert("Invalid digits");
            return;
          }
          throw e;
        })
        .finally(() => {
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
    <div className="flex flex-col gap-8">
      <Actionable
        buttonTitle="Set QR Code Host URL"
        inputs={scannedUrl && memberCredentials ? [scannedUrl, memberCredentials] : null}
        action={handleStart}
      >
        <TextInput
          placeholder="QR Code value (url)"
          value={scannedUrl || ""}
          onChange={e => setScannedUrl(e.target.value)}
          className="flex-1"
        />
      </Actionable>

      {digits ? (
        <Actionable
          buttonTitle="Send Digits"
          inputs={inputCallback && input && digits === input.length ? [inputCallback, input] : null}
          action={handleSendDigits}
        >
          <TextInput
            maxLength={digits}
            value={input || ""}
            onChange={e => setInput(e.target.value)}
            className="flex-1"
          />
        </Actionable>
      ) : null}
    </div>
  );
}
