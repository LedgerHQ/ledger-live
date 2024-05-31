import React, { useCallback, useEffect, useState } from "react";
import { device as trustchainDevice } from "@ledgerhq/hw-trustchain";
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
    </Container>
  );
};

export default App;
