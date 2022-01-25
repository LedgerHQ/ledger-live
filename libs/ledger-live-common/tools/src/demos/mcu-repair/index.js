// @flow

import React, { useState, useCallback, useEffect } from "react";
import styled from "styled-components";
import {
  getAllEnvs,
  setEnvUnsafe,
  setEnv
} from "@ledgerhq/live-common/lib/env";
import repair from "@ledgerhq/live-common/lib/hw/firmwareUpdate-repair";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: auto;
  max-width: 600px;
  height: 100vh;
  font-family: Inter, sans-serif;
  & h2 {
    font-family: Inter;
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 22px;
  }
`;

const Button = styled.button`
  padding: 12px 16px;
  border: none;
  background: ${p =>
    p.danger
      ? "#FF483820"
      : p.primary
      ? "#6490F1"
      : "rgba(100, 144, 241, 0.1)"};
  color: ${p => (p.danger ? "#FF4838" : p.primary ? "#fff" : "#6490F1")};
  border-radius: 4px;
  opacity: ${p => (p.disabled ? 0.3 : 1)};
  &:hover {
    opacity: ${p => (p.disabled ? 0.3 : 0.8)};
  }
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  > svg {
    padding-right: 5px;
  }
`;

const NoHidSupport = () => {
  return (
    <Container center>
      <h1>WebHID is not enabled on this Browser</h1>
      <h2>
        In Chrome/chromium, please enable{" "}
        <strong>Experimental Web Platform features</strong> in chrome://flags
      </h2>
    </Container>
  );
};

const Main = ({ deviceId }: { deviceId: string }) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    repair(deviceId).subscribe(
      e => {
        setProgress(e.progress);
      },
      error => {
        setError(error);
      }
    );
  }, [deviceId]);

  if (error) {
    return (
      <Container center>
        <h1>An error occurred. Please retry or contact us</h1>
        <h2>{String((error && error.message) || error)}</h2>
      </Container>
    );
  }

  return progress === 0 ? (
    <Container center>
      <h1>Loading...</h1>
    </Container>
  ) : progress === 1 ? (
    <Container center>
      <h1>Success!</h1>
      <h2>
        Please verify on your device the Firmware and Microcontroller versions
        under <strong>Settings > Firmware version</strong>
      </h2>
    </Container>
  ) : (
    <Container center>
      <h1>Installing... {(progress * 100).toFixed(0)}%</h1>
    </Container>
  );
};

const ConnectDevice = ({ onConnect }: { onConnect: (*) => * }) => {
  const onClick = useCallback(
    async e => {
      onConnect(e.target.name);
    },
    [onConnect]
  );
  return (
    <Container center>
      <h1>Repair your Ledger device</h1>

      <h2>Make sure your device is in "Bootloader"</h2>
      <ul>
        <li>Disconnect the USB cable from your device</li>
        <li>
          Press the left button and hold it while you reconnect the USB cable
          until the <strong>Bootloader</strong> screen appears
        </li>
      </ul>

      <h2>Start the repair mecanism</h2>

      <Button primary name="webhid" onClick={onClick}>
        Start with WebHID
      </Button>
    </Container>
  );
};

const MCURepair = ({ location }: *) => {
  useEffect(() => {
    const entries = location.search
      ? location.search
          .slice(1)
          .split("&")
          .map(o => o.split("="))
      : [];
    if (entries.length === 0) return;
    const beforeState = getAllEnvs();
    entries.forEach(([key, value]) => {
      if (key && value) {
        setEnvUnsafe(key, value);
      }
    });
    return () => {
      for (const key in beforeState) {
        // $FlowFixMe
        setEnv(key, beforeState[key]);
      }
    };
  }, [location]);

  const [deviceId, setDeviceId] = useState(null);

  const onConnect = useCallback(deviceId => {
    setDeviceId(deviceId);
  }, []);

  if (!("hid" in navigator)) {
    return <NoHidSupport />;
  }

  if (!deviceId) {
    return <ConnectDevice onConnect={onConnect} />;
  }

  return <Main deviceId={deviceId} />;
};

MCURepair.demo = {
  title: "MCU Repair",
  url: "/mcu-repair",
  hidden: true
};

export default MCURepair;
