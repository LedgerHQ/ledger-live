import React, { useCallback, useEffect, useState } from "react";
import { device as trustchainDevice } from "@ledgerhq/hw-trustchain";
import {
  createQRCodeHostInstance,
  createQRCodeCandidateInstance,
} from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import { sdk } from "@ledgerhq/trustchain";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from } from "rxjs";
import styled from "styled-components";
import { LiveCredentials, Trustchain } from "@ledgerhq/trustchain/types";

const Container = styled.div`
  padding: 20px;
  margin: 0 auto;
  max-width: 800px;
`;

const Label = styled.label`
  display: block;
  margin: 10px 0;
  button {
    margin-right: 10px;
  }
`;

function uint8arrayToHex(uint8arr: Uint8Array) {
  return Array.from(uint8arr, (byte: number) => {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}

const App = () => {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [seedIdAccessToken, setSeedIdAccessToken] = useState<{ accessToken: string } | null>(null);
  const [liveCredentials, setLiveCredentials] = useState<LiveCredentials | null>(null);
  const [trustchain, setTrustchain] = useState<Trustchain | null>(null);

  const onRequestPublicKey = useCallback(() => {
    withDevice("webhid")(transport => {
      const api = trustchainDevice.apdu(transport);
      async function main() {
        const pubkey = await api.getPublicKey();
        return pubkey;
      }
      return from(main());
    }).subscribe(p => setPubkey(uint8arrayToHex(p.publicKey)));
  }, []);

  const onSeedIdAuthenticate = useCallback(() => {
    withDevice("webhid")(transport => from(sdk.seedIdAuthenticate(transport))).subscribe({
      next: t => setSeedIdAccessToken(t),
      error: error => {
        console.error(error);
        setSeedIdAccessToken(null);
      },
    });
  }, []);

  const onInitLiveCredentials = useCallback(() => {
    sdk.initLiveCredentials().then(
      liveCredentials => {
        setLiveCredentials(liveCredentials);
      },
      error => {
        console.error(error);
        setLiveCredentials(null);
      },
    );
  }, []);

  const onGetOrCreateTrustchain = useCallback(() => {
    if (!seedIdAccessToken || !liveCredentials) return;
    withDevice("webhid")(transport =>
      from(sdk.getOrCreateTrustchain(transport, seedIdAccessToken, liveCredentials)),
    ).subscribe({
      next: t => setTrustchain(t),
      error: error => {
        console.error(error);
        setTrustchain(null);
      },
    });
  }, [seedIdAccessToken, liveCredentials]);

  return (
    <Container>
      <h2>hw-trustchain</h2>
      <Label>
        <button onClick={onRequestPublicKey}>Get Pub Key</button>
        <strong>
          <code>{pubkey ? pubkey : ""}</code>
        </strong>
      </Label>

      <Label>
        <button onClick={onSeedIdAuthenticate}>sdk.seedIdAuthenticate</button>
        <strong>
          <code>{seedIdAccessToken ? seedIdAccessToken.accessToken : ""}</code>
        </strong>
      </Label>

      <Label>
        <button onClick={onInitLiveCredentials}>sdk.initLiveCredentials</button>
        <strong>
          <code>{liveCredentials ? liveCredentials.pubkey : ""}</code>
        </strong>
      </Label>

      <Label>
        <button disabled={!seedIdAccessToken || !liveCredentials} onClick={onGetOrCreateTrustchain}>
          sdk.getOrCreateTrustchain
        </button>
        <strong>
          <code>{trustchain ? trustchain.rootId : ""}</code>
        </strong>
      </Label>

      <AppQRCodeHost trustchain={trustchain} liveCredentials={liveCredentials} />
      <AppQRCodeCandidate liveCredentials={liveCredentials} />
    </Container>
  );
};

function AppQRCodeHost({
  trustchain,
  liveCredentials,
}: {
  trustchain: Trustchain | null;
  liveCredentials: LiveCredentials | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [digits, setDigits] = useState<string | null>(null);
  const onStart = useCallback(() => {
    if (!trustchain || !liveCredentials) return;
    createQRCodeHostInstance({
      onDisplayQRCode: url => {
        setUrl(url);
      },
      onDisplayDigits: digits => {
        setDigits(digits);
      },
      addMember: async member => {
        const jwt = await sdk.liveAuthenticate(trustchain, liveCredentials);
        await sdk.addMember(jwt, trustchain, liveCredentials, member);
      },
    })
      .catch(e => {
        if (e instanceof InvalidDigitsError) {
          return;
        }
        alert("HOST: Failure: " + e);
      })
      .then(() => {
        setUrl(null);
        setDigits(null);
      });
  }, [trustchain, liveCredentials]);
  return (
    <details>
      <summary>QR Code Host playground</summary>
      <Label>
        <button disabled={!trustchain || !liveCredentials} onClick={onStart}>
          Create QR Code Host
        </button>
      </Label>
      {url && (
        <pre>
          <code>{url}</code>
        </pre>
      )}
      {digits && (
        <strong>
          Digits: <code>{digits}</code>
        </strong>
      )}
    </details>
  );
}

function AppQRCodeCandidate({ liveCredentials }: { liveCredentials: LiveCredentials | null }) {
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

  const handleStart = useCallback(() => {
    if (scannedUrl && liveCredentials) {
      createQRCodeCandidateInstance({
        liveCredentials,
        scannedUrl,
        memberName: "test",
        onRequestQRCodeInput,
      })
        .catch(e => {
          if (e instanceof InvalidDigitsError) {
            alert("Invalid digits");
            return;
          }
          alert("CANDIDATE: Failure: " + e);
        })
        .then(() => {
          setScannedUrl(null);
          setInput(null);
          setDigits(null);
          setInputCallback(null);
        });
    }
  }, [scannedUrl, liveCredentials, onRequestQRCodeInput]);

  const handleSendDigits = useCallback(() => {
    if (inputCallback && input !== null) {
      inputCallback(input);
    }
  }, [inputCallback, input]);

  return (
    <details>
      <summary>QR Code Candidate playground</summary>
      <label>
        Manually set the QR Code Host URL:
        <input type="text" value={scannedUrl || ""} onChange={e => setScannedUrl(e.target.value)} />
      </label>
      <br />
      <label>
        <button disabled={!scannedUrl || !liveCredentials} onClick={handleStart}>
          Start
        </button>
      </label>
      <br />
      {digits && (
        <div>
          <label>
            Digits:
            <input type="text" maxLength={digits} onChange={e => setInput(e.target.value)} />
          </label>
          <button disabled={!(input && digits === input.length)} onClick={handleSendDigits}>
            Send Digits
          </button>
        </div>
      )}
    </details>
  );
}

export default App;
