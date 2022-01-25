// @flow
import React, { useState, useEffect } from "react";
import Eth from "@ledgerhq/hw-app-eth";
import WebSocketTransport from "@ledgerhq/hw-transport-http/lib/WebSocketTransport";

const bridgeURL = "ws://localhost:8435";

function check() {
  return WebSocketTransport.check(bridgeURL);
}

function checkLoop(isCancelled) {
  return check().catch(async () => {
    await delay(500);
    if (isCancelled()) return;
    return checkLoop(isCancelled);
  });
}

function delay(ms) {
  return new Promise((success) => setTimeout(success, ms));
}

async function verifyAddress(onAddress) {
  const transport = await WebSocketTransport.open(bridgeURL);
  try {
    const eth = new Eth(transport);
    const { address } = await eth.getAddress("44'/60'/0'/0/0");
    onAddress(address);
    // trigger verification
    await eth.getAddress("44'/60'/0'/0/0", true);
  } finally {
    await transport.close();
  }
}

const initialState = {
  opened: false,
  available: false,
  address: "",
};

const BridgeTest = () => {
  const [{ opened, address, available }, setState] = useState(initialState);

  useEffect(() => {
    if (!opened) return;
    let cancelled = false;

    checkLoop(() => cancelled)
      .then(() => {
        if (cancelled) return;
        setState({
          ...initialState,
          opened: true,
          available: true,
        });
        return verifyAddress((address) =>
          setState({
            opened: true,
            available: true,
            address,
          })
        ).then(() => {
          setState(initialState);
        });
      })
      .catch((error) => {
        alert("" + error);
        console.error(error);
        setState(initialState);
      });

    return () => {
      cancelled = true;
    };
  }, [opened]);

  return (
    <div style={{ padding: 100 }}>
      {opened ? (
        !available ? (
          <div>
            Connecting...{" "}
            <button onClick={() => setState(initialState)}>cancel</button>
          </div>
        ) : !address ? (
          <div>Loading...</div>
        ) : (
          <div>{"Verify on your device the address: " + address}</div>
        )
      ) : (
        <a
          onClick={() =>
            setState({
              ...initialState,
              opened: true,
            })
          }
          href={`ledgerlive://bridge?appName=Ethereum&origin=${window.location.host}`}
        >
          Open with Ledger Live
        </a>
      )}
    </div>
  );
};

// $FlowFixMe
BridgeTest.demo = {
  title: "Bridge test",
  url: "/bridgetest",
  hidden: true,
};

export default BridgeTest;
