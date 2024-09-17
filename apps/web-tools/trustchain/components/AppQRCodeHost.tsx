import React, { useCallback, useState } from "react";
import { createQRCodeHostInstance } from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError, NoTrustchainInitialized } from "@ledgerhq/trustchain/errors";
import { MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { RenderActionable } from "./Actionable";
import QRCode from "./QRCode";
import { useTrustchainSDK } from "../context";
import { getEnv } from "@ledgerhq/live-env";

export function AppQRCodeHost({
  trustchain,
  memberCredentials,
}: {
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
}) {
  const sdk = useTrustchainSDK();
  const [error, setError] = useState<Error | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [digits, setDigits] = useState<string | null>(null);
  const onStart = useCallback(() => {
    if (!trustchain || !memberCredentials) return;
    setError(null);
    createQRCodeHostInstance({
      trustchainApiBaseUrl: getEnv("TRUSTCHAIN_API_STAGING"),
      onDisplayQRCode: url => {
        setUrl(url);
      },
      onDisplayDigits: digits => {
        setDigits(digits);
      },
      addMember: async member => {
        if (trustchain) {
          await sdk.addMember(trustchain, memberCredentials, member);
          return trustchain;
        }
        throw new NoTrustchainInitialized();
      },
      memberCredentials,
      memberName: "WebTools",
      initialTrustchainId: trustchain.rootId,
    })
      .catch(e => {
        if (e instanceof InvalidDigitsError) {
          return;
        }
        setError(e);
      })
      .then(() => {
        setUrl(null);
        setDigits(null);
      });
  }, [trustchain, memberCredentials, sdk]);
  return (
    <div>
      {" "}
      <RenderActionable
        enabled={!!trustchain && !!memberCredentials}
        error={error}
        loading={!!url}
        onClick={onStart}
        display={url}
        buttonTitle="Create QR Code Host"
        buttonProps={{
          "data-tooltip-id": "tooltip",
          "data-tooltip-content":
            "creates a QR code flow for a candidate who wants to be added as new member of the trustchain",
        }}
      />
      <div>
        {digits ? (
          <strong style={{ fontSize: "3em" }}>
            <code>Digits: {digits}</code>
          </strong>
        ) : url ? (
          <QRCode data={url} />
        ) : null}
      </div>
    </div>
  );
}
