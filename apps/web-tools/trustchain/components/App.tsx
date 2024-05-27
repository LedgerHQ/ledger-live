import React, { useCallback, useState } from "react";
import { PublicKey, device as trustchainDevice } from "@ledgerhq/hw-trustchain";
import {
  createQRCodeHostInstance,
  createQRCodeCandidateInstance,
} from "@ledgerhq/trustchain/qrcode/index";
import { InvalidDigitsError } from "@ledgerhq/trustchain/errors";
import { getSdk } from "@ledgerhq/trustchain";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from, lastValueFrom } from "rxjs";
import styled from "styled-components";
import { JWT, LiveCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { Actionable, RenderActionable } from "./Actionable";
import Transport from "@ledgerhq/hw-transport";
import { TrustchainSDK } from "@ledgerhq/trustchain/lib-es/types";

const Container = styled.div`
  padding: 20px;
  margin: 0 auto;
  max-width: 800px;
  display: flex;
  flex-direction: column;
`;

const App = () => {
  const [seedIdAccessToken, setSeedIdAccessToken] = useState<{ accessToken: string } | null>(null);
  const [liveCredentials, setLiveCredentials] = useState<LiveCredentials | null>(null);
  const [trustchain, setTrustchain] = useState<Trustchain | null>(null);

  const [sdk, setSdk] = useState(getSdk() as TrustchainSDK);

  return (
    <Container>
      <h2>Wallet Sync Trustchain Playground</h2>
      <AppMockEnv setSdk={setSdk} />
      <AppGetPublicKey />
      <AppInitLiveCredentials
        sdk={sdk}
        liveCredentials={liveCredentials}
        setLiveCredentials={setLiveCredentials}
      />
      <AppSeedIdAuthenticate
        sdk={sdk}
        seedIdAccessToken={seedIdAccessToken}
        setSeedIdAccessToken={setSeedIdAccessToken}
      />
      <AppGetOrCreateTrustchain
        sdk={sdk}
        seedIdAccessToken={seedIdAccessToken}
        liveCredentials={liveCredentials}
        trustchain={trustchain}
        setTrustchain={setTrustchain}
      />
      <AppQRCodeHost sdk={sdk} trustchain={trustchain} liveCredentials={liveCredentials} />
      <AppQRCodeCandidate liveCredentials={liveCredentials} />
    </Container>
  );
};

function runWithDevice<T>(fn: (transport: Transport) => Promise<T>): Promise<T> {
  return lastValueFrom(withDevice("webhid")(transport => from(fn(transport))));
}

function uint8arrayToHex(uint8arr: Uint8Array) {
  return Array.from(uint8arr, (byte: number) => {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
}

function AppGetPublicKey() {
  const [pubkey, setPubkey] = useState<PublicKey | null>(null);
  const action = useCallback(
    () => runWithDevice(transport => trustchainDevice.apdu(transport).getPublicKey()),
    [],
  );

  const valueDisplay = useCallback((pubkey: PublicKey) => uint8arrayToHex(pubkey.publicKey), []);

  return (
    <Actionable
      buttonTitle="Get Pub Key"
      inputs={[]}
      action={action}
      valueDisplay={valueDisplay}
      value={pubkey}
      setValue={setPubkey}
    />
  );
}

const Label = styled.label`
  display: block;
  margin: 10px 0;
  button {
    margin-right: 10px;
  }
`;

function AppMockEnv({
  setSdk,
}: {
  setSdk: React.Dispatch<React.SetStateAction<TrustchainSDK>>;
}) {
  const [isMockEnv, setIsMockEnv] = useState(!!getEnv("MOCK"));
  const toggleMockEnv = async () => {
    const isMockEnv = !!getEnv("MOCK");
    setEnv("MOCK", isMockEnv ? "" : "1");
    setIsMockEnv(!isMockEnv);
    const sdk: TrustchainSDK = getSdk();
    setSdk(sdk);
  };

  return (
    <Label>
      <button onClick={toggleMockEnv}>Toggle Mock Env</button>
        <strong>
          MOCK ENV : <code>{JSON.stringify(isMockEnv)}</code>
      </strong>
    </Label>
  );
}

function AppInitLiveCredentials({
  sdk,
  liveCredentials,
  setLiveCredentials,
}: {
  sdk: TrustchainSDK;
  liveCredentials: LiveCredentials | null;
  setLiveCredentials: (liveCredentials: LiveCredentials | null) => void;
}) {
  const action = useCallback(() => sdk.initLiveCredentials(), [sdk]);

  const valueDisplay = useCallback(
    (liveCredentials: LiveCredentials) => "pubkey: " + liveCredentials.pubkey,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.initLiveCredentials"
      inputs={[]}
      action={action}
      setValue={setLiveCredentials}
      value={liveCredentials}
      valueDisplay={valueDisplay}
    />
  );
}

function AppSeedIdAuthenticate({
  sdk,
  seedIdAccessToken,
  setSeedIdAccessToken,
}: {
  sdk: TrustchainSDK;
  seedIdAccessToken: { accessToken: string } | null;
  setSeedIdAccessToken: (seedIdAccessToken: { accessToken: string } | null) => void;
}) {
  const action = useCallback(
    () => runWithDevice(transport => sdk.seedIdAuthenticate(transport)),
    [sdk],
  );

  const valueDisplay = useCallback(
    (seedIdAccessToken: { accessToken: string }) => "JWT: " + seedIdAccessToken.accessToken,
    [],
  );

  return (
    <Actionable
      buttonTitle="sdk.seedIdAuthenticate"
      inputs={[]}
      action={action}
      valueDisplay={valueDisplay}
      value={seedIdAccessToken}
      setValue={setSeedIdAccessToken}
    />
  );
}

function AppGetOrCreateTrustchain({
  sdk,
  seedIdAccessToken,
  liveCredentials,
  trustchain,
  setTrustchain,
}: {
  sdk: TrustchainSDK;
  seedIdAccessToken: JWT | null;
  liveCredentials: LiveCredentials | null;
  trustchain: Trustchain | null;
  setTrustchain: (trustchain: Trustchain | null) => void;
}) {
  const action = useCallback(
    (seedIdAccessToken: JWT, liveCredentials: LiveCredentials) =>
      runWithDevice(transport =>
        sdk.getOrCreateTrustchain(transport, seedIdAccessToken, liveCredentials),
      ),
    [sdk],
  );

  const valueDisplay = useCallback((trustchain: Trustchain) => trustchain.rootId, []);

  return (
    <Actionable
      buttonTitle="sdk.getOrCreateTrustchain"
      inputs={seedIdAccessToken && liveCredentials ? [seedIdAccessToken, liveCredentials] : null}
      action={action}
      valueDisplay={valueDisplay}
      value={trustchain}
      setValue={setTrustchain}
    />
  );
}

function AppQRCodeHost({
  sdk,
  trustchain,
  liveCredentials,
}: {
  sdk: TrustchainSDK;
  trustchain: Trustchain | null;
  liveCredentials: LiveCredentials | null;
}) {
  const [error, setError] = useState<Error | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [digits, setDigits] = useState<string | null>(null);
  const onStart = useCallback(() => {
    if (!trustchain || !liveCredentials) return;
    setError(null);
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
        setError(e);
      })
      .then(() => {
        setUrl(null);
        setDigits(null);
      });
  }, [trustchain, liveCredentials, sdk]);
  return (
    <details>
      <summary>QR Code Host playground</summary>

      <RenderActionable
        enabled={!!trustchain && !!liveCredentials}
        error={null}
        loading={!!url}
        onClick={onStart}
        display={url}
        buttonTitle="Create QR Code Host"
      />
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
