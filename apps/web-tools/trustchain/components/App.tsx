import React, { useEffect, useState } from "react";
import { device as trustchainDevice, PublicKey } from "@ledgerhq/hw-trustchain";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from } from "rxjs";
import styled from "styled-components";

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

function basicTest() {
  const $result = withDevice("webhid")(transport => {
    const api = trustchainDevice.apdu(transport);
    async function main() {
      const pubkey = await api.getPublicKey();
      return pubkey;
    }
    return from(main());
  });
  return $result;
}

const App = () => {
  const [pubkey, setPubkey] = useState<string | null>(null);
  const onRequestPublicKey = () => {
    basicTest().subscribe(p => setPubkey(uint8arrayToHex(p.publicKey)));
  };
  return (
    <Container>
      <h2>hw-trustchain</h2>
      <Label>
        <button onClick={onRequestPublicKey}>Get Pub Key</button>
        <strong>
          <code>{pubkey ? pubkey : ""}</code>
        </strong>
      </Label>
    </Container>
  );
};

export default App;
