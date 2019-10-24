// @flow

import React, { useState, useMemo, useCallback, useEffect } from "react";
import styled from "styled-components";
import {
  getAllEnvs,
  setEnvUnsafe,
  setEnv
} from "@ledgerhq/live-common/lib/env";
import { open } from "@ledgerhq/live-common/lib/hw";
import { getDeviceModel } from "@ledgerhq/devices";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import manager from "@ledgerhq/live-common/lib/manager";
import {
  listApps,
  useAppsRunner,
  execWithTransport,
  getActionPlan
} from "@ledgerhq/live-common/lib/apps";
import ReactTooltip from "react-tooltip";
import { prettyActionPlan } from "@ledgerhq/live-common/lib/apps/mock";
import { StorageBar, DeviceIllustration } from "./DeviceStorage";
import {
  distribute,
  blockToBytes,
  inferAppSize,
  lenseAppHash,
  formatSize
} from "./sizes";

const Container = styled.div`
  width: 600px;
  margin: 20px auto;
  font-family: Inter, sans-serif;
`;

const AppRow = styled.div`
  display: flex;
  flex-sirection: row;
  align-items: center;
  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
  margin-bottom: 10px;
  padding-bottom: 10px;
  font-size: 12px;
`;

const AppName = styled.div`
  flex-direction: column;
  padding-left: 10px;
  width: 200px;
`;

const AppSize = styled.div`
  flex: 1;
  color: #999;
`;

const CryptoName = styled.div`
  font-weight: bold;
  padding: 2px 0;
`;

const CryptoVersion = styled.div`
  color: #999;
  padding: 2px 0;
`;

const AppActions = styled.div`
  > *:not(:last-child) {
    margin-right: 10px;
  }
`;

const Separator = styled.div`
  height: 1px;
  margin: 20px 0px;
  background: #e1e3ea;
  width: 100%;
`;

const Info = styled.div`
  font-family: Inter;
  display: flex;
  margin-bottom: 20px;
  font-size: 13px;
  line-height: 16px;

  & > div {
    display: flex;
    flex-direction: row;
    color: #999999;
    & > :nth-child(2) {
      font-weight: bold;
      color: #222222;
      margin-left: 10px;
    }
    margin-right: 30px;
  }
`;

const FreeInfo = styled.div`
  padding: 10px 0;
  font-size: 13px;
  line-height: 16px;
  color: ${p => (p.danger ? "#EB5757" : "#000")};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
`;

const Progress = ({ value }) => (
  <div
    style={{
      width: 90,
      height: 5,
      background: "#E6E6E6",
      position: "relative",
      borderRadius: 5
    }}
  >
    <div
      style={{
        position: "absolute",
        background: "#6490F1",
        height: "100%",
        borderRadius: 5,
        width: (value * 100).toFixed(2) + "%"
      }}
    />
  </div>
);

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
  &:hover {
    opacity: 0.8;
  }
`;

const AppPreview = ({ app }: *) => (
  <img alt="" src={manager.getIconUrl(app.icon)} width={40} height={40} />
);

const AppItem = ({
  app,
  installed,
  installedAvailable,
  scheduled,
  dispatch,
  progress,
  error
}) => {
  const { name } = app;
  const onInstall = useCallback(() => dispatch({ type: "install", name }), [
    dispatch,
    name
  ]);
  const onUninstall = useCallback(() => dispatch({ type: "uninstall", name }), [
    dispatch,
    name
  ]);
  return (
    <AppRow>
      <AppPreview app={app} />
      <AppName>
        <CryptoName>{`${app.name}${
          app.currency ? ` (${app.currency.ticker})` : ""
        }`}</CryptoName>
        <CryptoVersion>{`Version ${app.version}${
          installed && !installed.updated ? " (NEW)" : ""
        }`}</CryptoVersion>
      </AppName>
      <AppSize>
        {formatSize(
          blockToBytes(
            (installed && installed.blocks) ||
              inferAppSize({ key: app.firmware })
          )
        )}
      </AppSize>
      {error ? (
        <Button danger style={{ color: "red" }} title={String(error)}>
          !
        </Button>
      ) : progress || scheduled ? (
        <div style={{ textAlign: "right" }}>
          {progress ? (
            <div style={{ color: "#6490F1", marginBottom: 5 }}>
              {progress.appOp.type === "install"
                ? "Installing..."
                : "Uninstalling..."}
            </div>
          ) : (
            <div
              style={{
                display: "inline-block",
                marginBottom: 5,
                opacity: 0.5,
                cursor: "pointer"
              }}
              onClick={
                (progress ? progress.appOp : scheduled).type === "install"
                  ? onUninstall
                  : onInstall
              }
            >
              Cancel
            </div>
          )}
          <Progress value={progress ? progress.progress : 0} />
        </div>
      ) : (
        <AppActions>
          {installed || !installedAvailable ? (
            <Button danger onClick={onUninstall}>
              Uninstall
            </Button>
          ) : null}
          {installed && !installed.updated ? (
            <Button primary onClick={onInstall}>
              Update
            </Button>
          ) : !installed ? (
            <Button onClick={onInstall}>Install</Button>
          ) : null}
        </AppActions>
      )}
    </AppRow>
  );
};

const dangerIcon = (
  <svg
    width="24"
    height="23"
    viewBox="0 0 24 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8.94948 4.34368L2.51426 15.7841C1.20188 18.1172 2.88788 21 5.56477 21H18.4352C21.1121 21 22.7981 18.1172 21.4857 15.7841L15.0505 4.34368C13.7124 1.9649 10.2875 1.9649 8.94948 4.34368Z"
      fill="#EB5757"
      stroke="white"
      stroke-width="4"
    />
    <circle cx="12" cy="16" r="1" fill="white" />
    <path
      d="M12 9.5V12.5"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const Main = ({ transport, deviceInfo, listAppsRes }) => {
  const exec = useMemo(() => execWithTransport(transport), [transport]);
  const [state, dispatch] = useAppsRunner(listAppsRes, exec);
  const { currentProgress, currentError } = state;
  const onUpdateAll = useCallback(() => dispatch({ type: "updateAll" }), [
    dispatch
  ]);
  const plan = getActionPlan(state);

  // $FlowFixMe
  const deviceModel = transport.deviceModel || getDeviceModel("nanoS");

  // eslint-disable-next-line no-console
  console.log(state);

  useEffect(() => {
    ReactTooltip.rebuild();
  }, [state.installed]);

  const mapApp = app => (
    <AppItem
      key={app.name}
      scheduled={plan.find(a => a.name === app.name)}
      app={app}
      progress={
        currentProgress && currentProgress.appOp.name === app.name
          ? currentProgress
          : null
      }
      error={
        currentError && currentError.appOp.name === app.name
          ? currentError.error
          : null
      }
      installed={state.installed.find(ins => ins.name === app.name)}
      dispatch={dispatch}
      installedAvailable={state.installedAvailable}
    />
  );

  const installedApps = state.installed
    .map(i => state.apps.find(a => a.name === i.name))
    .filter(Boolean);
  const nonInstalledApps = state.apps.filter(a => !installedApps.includes(a));

  const distribution = distribute({
    deviceModel,
    deviceInfo,
    installed: state.installed
  });

  const dangerSpace = distribution.freeSpaceBlocks < 6;

  return (
    <Container>
      <ReactTooltip
        id="tooltip"
        effect="solid"
        getContent={dataTip => {
          if (!dataTip) return null;
          const { name, bytes } = JSON.parse(dataTip);
          return (
            <>
              <div
                style={{
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.7)"
                }}
              >
                {name}
              </div>
              <div style={{ textAlign: "center", color: "white" }}>
                {formatSize(bytes)}
              </div>
            </>
          );
        }}
      />
      <div style={{ display: "flex", flexDirection: "row" }}>
        <DeviceIllustration deviceModel={deviceModel} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              marginBottom: 4,
              fontSize: "16px",
              lineHeight: "19px",
              fontFamily: "Inter"
            }}
          >
            <strong>{deviceModel.productName}</strong>
          </div>
          <div
            style={{
              fontFamily: "Inter",
              fontSize: "13px",
              lineHeight: "16px",
              color: "#999999"
            }}
          >
            Firmware {deviceInfo.version}
          </div>
          <Separator />
          <Info>
            <div>
              <span>Used</span>
              <span>{formatSize(distribution.totalAppsBytes)}</span>
            </div>
            <div>
              <span>Capacity</span>
              <span>{formatSize(distribution.appsSpaceBytes)}</span>
            </div>
            <div>
              <span>Apps installed</span>
              <span>{distribution.apps.length}</span>
            </div>
          </Info>
          <StorageBar distribution={distribution} />
          <FreeInfo danger={dangerSpace}>
            {dangerSpace ? dangerIcon : ""}{" "}
            {formatSize(distribution.freeSpaceBytes)} Free
          </FreeInfo>
        </div>
      </div>
      <h2 style={{ marginTop: "30px", display: "flex", flexDirection: "row" }}>
        {"On Device "}
        <span style={{ flex: 1 }} />
        {state.installed.some(i => !i.updated) ? (
          <Button onClick={onUpdateAll}>Update all</Button>
        ) : null}
      </h2>

      {!state.installedAvailable ? (
        <div style={{ color: "red" }}>HSM list apps not available!!</div>
      ) : null}

      <div>
        {installedApps.length
          ? installedApps.map(mapApp)
          : "No apps installed."}
      </div>

      <div style={{ fontSize: "10px", opacity: 0.3 }}>
        {prettyActionPlan(plan)}
      </div>

      <h2>App Store</h2>

      <div>{nonInstalledApps.map(mapApp)}</div>
    </Container>
  );
};

const ConnectDevice = ({
  onConnect,
  loading,
  error
}: {
  onConnect: (*) => *,
  error: ?Error,
  loading?: boolean
}) => {
  const onClick = useCallback(
    async e => {
      const transport = await open(e.target.name);
      await onConnect(transport);
    },
    [onConnect]
  );
  return (
    <Container>
      {loading ? <h1>Loading...</h1> : <h1>Please connect your device</h1>}

      {error ? (
        <div style={{ marginBottom: 10 }}>
          <p>{String(error)}</p>
          <p>
            <a href="/manager?FORCE_PROVIDER=4">
              You may try on /manager?FORCE_PROVIDER=4
            </a>
          </p>
        </div>
      ) : null}

      {!error && loading ? (
        "Please allow permission on your device..."
      ) : (
        <AppActions>
          <Button primary name="webusb" onClick={onClick}>
            USB
          </Button>
          <Button name="webhid" onClick={onClick}>
            WebHID
          </Button>
          <Button name="webble" onClick={onClick}>
            Bluetooth
          </Button>
        </AppActions>
      )}
    </Container>
  );
};

const Manager = ({ location }: *) => {
  const [transport, setTransport] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [listAppsRes, setListAppsRes] = useState(null);
  const [error, setError] = useState(null);
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

  const onConnect = useCallback(async transport => {
    try {
      setTransport(transport);
      let disconnected = false;
      transport.on("disconnect", () => {
        disconnected = true;
        setTransport(null);
      });
      const deviceInfo = await getDeviceInfo(transport);
      if (disconnected) return;
      setDeviceInfo(deviceInfo);
      const listAppsRes = await listApps(transport, deviceInfo, {
        inferAppSize,
        lenseAppHash
      });
      if (disconnected) return;
      setError(null);
      setListAppsRes(listAppsRes);
    } catch (error) {
      setError(error);
    }
  }, []);

  if (!transport) {
    return <ConnectDevice error={error} onConnect={onConnect} />;
  }

  if (!listAppsRes || !deviceInfo) {
    return <ConnectDevice error={error} onConnect={onConnect} loading />;
  }

  return (
    <Main
      transport={transport}
      deviceInfo={deviceInfo}
      listAppsRes={listAppsRes}
    />
  );
};

Manager.demo = {
  title: "Manager",
  url: "/manager",
  hidden: true
};

export default Manager;
