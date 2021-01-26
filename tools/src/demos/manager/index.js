// @flow

import React, { useState, useMemo, useCallback, useEffect } from "react";
import styled from "styled-components";
import {
  getAllEnvs,
  setEnvUnsafe,
  setEnv,
} from "@ledgerhq/live-common/lib/env";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { open } from "@ledgerhq/live-common/lib/hw";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import manager from "@ledgerhq/live-common/lib/manager";
import {
  useAppsRunner,
  getActionPlan,
  prettyActionPlan,
  distribute,
  formatSize,
  reducer,
  predictOptimisticState,
  isOutOfMemoryState,
} from "@ledgerhq/live-common/lib/apps";
import { listApps, execWithTransport } from "@ledgerhq/live-common/lib/apps/hw";
import ReactTooltip from "react-tooltip";
import { StorageBar, DeviceIllustration } from "./DeviceStorage";

/*
import {
  blockToBytes,
  inferAppSize,
  lenseAppHash,
} from "./sizes";
*/

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  text-align: ${(p) => (p.center ? "center" : "left")};
  align-items: ${(p) => (p.center ? "center" : "initial")};
  background-color: #f8f8f8;
  width: 100vw;
  min-height: 100vh;
  font-family: Inter, sans-serif;

  & > div {
  }
  & h2 {
    font-family: Inter;
    font-style: normal;
    font-weight: 500;
    font-size: 18px;
    line-height: 22px;
  }
`;

const SectionContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  max-width: 1200px;
  margin: 0 auto;
`;

const Section = styled.div`
  flex: 1;
  margin: 40px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
`;

const Card = styled.div`
  background: #ffffff;
  padding: 24px 20px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: auto;
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
  display: flex;
  flex-direction: row;
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
  color: ${(p) => (p.danger ? "#EB5757" : "#000")};
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
      borderRadius: 5,
    }}
  >
    <div
      style={{
        position: "absolute",
        background: "#6490F1",
        height: "100%",
        borderRadius: 5,
        width: (value * 100).toFixed(2) + "%",
      }}
    />
  </div>
);

const Button = styled.button`
  padding: 12px 16px;
  border: none;
  background: ${(p) =>
    p.danger
      ? "#FF483820"
      : p.primary
      ? "#6490F1"
      : "rgba(100, 144, 241, 0.1)"};
  color: ${(p) => (p.danger ? "#FF4838" : p.primary ? "#fff" : "#6490F1")};
  border-radius: 4px;
  opacity: ${(p) => (p.disabled ? 0.3 : 1)};
  &:hover {
    opacity: ${(p) => (p.disabled ? 0.3 : 0.8)};
  }
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  > svg {
    padding-right: 5px;
  }
`;

const successInstallIcon = (
  <svg
    width="12"
    height="10"
    viewBox="0 0 12 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.09094 5.00002L4.36367 8.27275L10.9091 1.72729"
      stroke="#75B642"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const updateIcon = (
  <svg
    width="14"
    height="16"
    viewBox="0 0 14 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.7276 5.22282C11.6962 3.0998 9.51914 1.63635 7.00029 1.63635C4.15088 1.63635 1.73887 3.5091 0.927979 6.0909M1.27301 10.7772C2.30438 12.9002 4.48143 14.3636 7.00029 14.3636C9.84969 14.3636 12.2617 12.4909 13.0726 9.90908"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M13.0455 2.27271V5.45452H9.86365"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M0.954535 13.7272L0.954535 10.5454L4.13635 10.5454"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const installIcon = (
  <svg
    width="14"
    height="16"
    viewBox="0 0 14 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7 1.63637V14.3636M7 14.3636L10.5 10.8636M7 14.3636L3.5 10.8636"
      stroke="#6490F1"
      stroke-width="1.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const SuccessInstall = styled.div`
  color: #75b642;
  font-size: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  > svg {
    padding-right: 5px;
  }
`;

const InputSearch = styled.input`
  border: none;
  background: none;
  width: 100%;
  height: 60px;
  margin-top: -24px;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  box-sizing: border-box;
  color: #222;
  outline: none;
`;

const AppPreview = ({ app }: *) => (
  <img alt="" src={manager.getIconUrl(app.icon)} width={40} height={40} />
);

const AppItem = ({
  state,
  app,
  installed,
  installedAvailable,
  scheduled,
  dispatch,
  progress,
  error,
  appStoreView,
  deviceModel,
}) => {
  const { name } = app;
  const onInstall = useCallback(() => dispatch({ type: "install", name }), [
    dispatch,
    name,
  ]);
  const onUninstall = useCallback(() => dispatch({ type: "uninstall", name }), [
    dispatch,
    name,
  ]);
  const notEnoughMemoryToInstall = useMemo(
    () =>
      isOutOfMemoryState(
        predictOptimisticState(reducer(state, { type: "install", name }))
      ),
    [name, state]
  );
  return (
    <AppRow>
      <AppPreview app={app} />
      <AppName>
        <CryptoName>{`${app.name}${
          app.currencyId
            ? ` (${getCryptoCurrencyById(app.currencyId).ticker})`
            : ""
        }`}</CryptoName>
        <CryptoVersion>{`Version ${app.version}${
          installed && !installed.updated ? " (NEW)" : ""
        }`}</CryptoVersion>
      </AppName>
      <AppSize>
        {formatSize(
          ((installed && installed.blocks) || 0) * deviceModel.deviceSize ||
            app.bytes ||
            0,
          4096
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
                cursor: "pointer",
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
          {(installed || !installedAvailable) && !appStoreView ? (
            <Button danger onClick={onUninstall}>
              {trashIcon}
            </Button>
          ) : null}
          {appStoreView && installed && installed.updated ? (
            <SuccessInstall>
              {successInstallIcon}
              Installed
            </SuccessInstall>
          ) : null}

          {installed && !installed.updated ? (
            <Button
              disabled={notEnoughMemoryToInstall}
              primary
              onClick={notEnoughMemoryToInstall ? null : onInstall}
            >
              {updateIcon} Update
            </Button>
          ) : !installed ? (
            <Button
              disabled={notEnoughMemoryToInstall}
              onClick={notEnoughMemoryToInstall ? null : onInstall}
            >
              {installIcon} Install
            </Button>
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

const trashIcon = (
  <svg
    width="16"
    height="18"
    viewBox="0 0 16 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M6.39226 3.09245H9.60278C9.43826 2.56314 8.94459 2.17881 8.36116 2.17881H7.63389C7.05046 2.17881 6.55679 2.56314 6.39226 3.09245ZM11.0337 3.09245H14.3006C14.7149 3.09245 15.0506 3.42823 15.0506 3.84245C15.0506 4.25666 14.7149 4.59245 14.3006 4.59245H1.69458C1.28037 4.59245 0.94458 4.25666 0.94458 3.84245C0.94458 3.42823 1.28037 3.09245 1.69458 3.09245H4.96132C5.14876 1.78431 6.2739 0.778809 7.63389 0.778809H8.36116C9.72115 0.778809 10.8463 1.78431 11.0337 3.09245ZM3.97025 5.4182V14.4485C3.97025 15.1665 4.55228 15.7485 5.27025 15.7485H10.7248C11.4428 15.7485 12.0248 15.1665 12.0248 14.4485V5.4182H13.4248V14.4485C13.4248 15.9397 12.216 17.1485 10.7248 17.1485H5.27025C3.77908 17.1485 2.57025 15.9397 2.57025 14.4485V5.4182H3.97025ZM9.57346 7.08184C9.96006 7.08184 10.2735 7.39524 10.2735 7.78184V13.297C10.2735 13.6836 9.96006 13.997 9.57346 13.997C9.18686 13.997 8.87346 13.6836 8.87346 13.297V7.78184C8.87346 7.39524 9.18686 7.08184 9.57346 7.08184ZM7.12185 7.78184C7.12185 7.39524 6.80845 7.08184 6.42185 7.08184C6.03526 7.08184 5.72186 7.39524 5.72186 7.78184V13.297C5.72186 13.6836 6.03526 13.997 6.42185 13.997C6.80845 13.997 7.12185 13.6836 7.12185 13.297V7.78184Z"
      fill="#FF4838"
    />
  </svg>
);

const Main = ({ transport, deviceInfo, listAppsRes }) => {
  const exec = useMemo(() => execWithTransport(transport), [transport]);
  const [state, dispatch] = useAppsRunner(listAppsRes, exec);
  const { currentProgress, currentError } = state;
  const onUpdateAll = useCallback(() => dispatch({ type: "updateAll" }), [
    dispatch,
  ]);
  const [search, setSearch] = useState("");
  const onChangeSearch = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const plan = getActionPlan(state);

  // eslint-disable-next-line no-console
  console.log(state);

  useEffect(() => {
    ReactTooltip.rebuild();
  }, [state.installed]);

  const mapApp = (app, appStoreView) => (
    <AppItem
      state={state}
      key={app.name}
      scheduled={plan.find((a) => a.name === app.name)}
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
      installed={state.installed.find((ins) => ins.name === app.name)}
      dispatch={dispatch}
      installedAvailable={state.installedAvailable}
      appStoreView={appStoreView}
      deviceModel={state.deviceModel}
    />
  );

  const installedApps = state.installed
    .map((i) => state.apps.find((a) => a.name === i.name))
    .filter(Boolean);

  const appsList = state.apps.filter(({ name, currency }) => {
    if (!search) return true;
    const terms =
      name + " " + (currency ? currency.name + " " + currency.ticker : "");
    return terms.toLowerCase().includes(search.toLowerCase().trim());
  });

  const distribution = distribute(state);

  return (
    <Container>
      <SectionContainer>
        <ReactTooltip
          id="tooltip"
          effect="solid"
          getContent={(dataTip) => {
            if (!dataTip) return null;
            const { name, bytes } = JSON.parse(dataTip);
            return (
              <>
                <div
                  style={{
                    textAlign: "center",
                    color: "rgba(255, 255, 255, 0.7)",
                  }}
                >
                  {name}
                </div>
                <div style={{ textAlign: "center", color: "white" }}>
                  {formatSize(bytes, 4096)}
                </div>
              </>
            );
          }}
        />
        <Section>
          <h2>App Store</h2>
          <Card>
            <InputSearch
              autoFocus
              placeholder="Search app..."
              value={search}
              onChange={onChangeSearch}
            />
            {appsList.map((app) => mapApp(app, true))}
          </Card>
        </Section>
        <Section>
          <h2>Device Manager</h2>
          <Card
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <DeviceIllustration
              deviceModel={state.deviceModel}
              style={{ marginLeft: 36 }}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  marginBottom: 4,
                  fontSize: "16px",
                  lineHeight: "19px",
                  fontFamily: "Inter",
                }}
              >
                <strong>{state.deviceModel.productName}</strong>
              </div>
              <div
                style={{
                  fontFamily: "Inter",
                  fontSize: "13px",
                  lineHeight: "16px",
                  color: "#999999",
                }}
              >
                Firmware {deviceInfo.version}
              </div>
              <Separator />
              <Info>
                <div>
                  <span>Used</span>
                  <span>{formatSize(distribution.totalAppsBytes, 4096)}</span>
                </div>
                <div>
                  <span>Capacity</span>
                  <span>{formatSize(distribution.appsSpaceBytes, 4096)}</span>
                </div>
                <div>
                  <span>Apps installed</span>
                  <span>{distribution.apps.length}</span>
                </div>
              </Info>
              <StorageBar distribution={distribution} />
              <FreeInfo danger={distribution.shouldWarnMemory}>
                {distribution.shouldWarnMemory ? dangerIcon : ""}{" "}
                {formatSize(distribution.freeSpaceBytes, 4096)} Free
              </FreeInfo>
            </div>
          </Card>
          <h2
            style={{ marginTop: "30px", display: "flex", flexDirection: "row" }}
          >
            {"On Device "}
            <span style={{ flex: 1 }} />
            {state.installed.some((i) => !i.updated) ? (
              <Button onClick={onUpdateAll}>Update all</Button>
            ) : null}
          </h2>

          {!state.installedAvailable ? (
            <div style={{ color: "red" }}>HSM list apps not available!!</div>
          ) : null}

          <Card>
            {installedApps.length
              ? installedApps.map((app) => mapApp(app))
              : "No apps installed."}
          </Card>

          <div style={{ fontSize: "10px", opacity: 0.3, marginTop: 10 }}>
            {prettyActionPlan(plan)}
          </div>
        </Section>
      </SectionContainer>
    </Container>
  );
};

const ConnectDevice = ({
  onConnect,
  loading,
  devicePermissionRequested,
  error,
}: {
  onConnect: (*) => *,
  error: ?Error,
  devicePermissionRequested?: ?{ wording: string },
  loading?: boolean,
}) => {
  const onClick = useCallback(
    async (e) => {
      const transport = await open(e.target.name);
      await onConnect(transport);
    },
    [onConnect]
  );
  return (
    <Container center>
      <div>
        {loading ? (
          error ? (
            <h1>Sorry, a problem occurred!</h1>
          ) : !devicePermissionRequested ? (
            <h1>Loading...</h1>
          ) : (
            <h1 style={{ fontWeight: "normal" }}>
              {"Please "}
              <strong>{devicePermissionRequested.wording}</strong>
              {" on your device..."}
            </h1>
          )
        ) : (
          <h1>Please connect your device</h1>
        )}

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

        {!error && loading ? null : (
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
      </div>
    </Container>
  );
};

const Manager = ({ location }: *) => {
  const [transport, setTransport] = useState(null);
  const [devicePermissionRequested, setDevicePermissionRequested] = useState(
    null
  );
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [listAppsRes, setListAppsRes] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const entries = location.search
      ? location.search
          .slice(1)
          .split("&")
          .map((o) => o.split("="))
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

  const onConnect = useCallback(async (transport) => {
    try {
      setTransport(transport);
      let disconnected = false;
      transport.on("disconnect", () => {
        disconnected = true;
        setTransport(null);
        setDeviceInfo(null);
        setListAppsRes(null);
      });
      const deviceInfo = await getDeviceInfo(transport);
      if (disconnected) return;
      setDeviceInfo(deviceInfo);
      const listAppsRes = await new Promise((resolve, reject) => {
        listApps(transport, deviceInfo).subscribe({
          error: reject,
          next: (e) => {
            if (e.type === "result") {
              resolve(e.result);
            } else if (e.type === "device-permission-requested") {
              setDevicePermissionRequested({ wording: e.wording });
            } else if (e.type === "device-permission-granted") {
              setDevicePermissionRequested(null);
            }
          },
        });
      });
      if (disconnected) return;
      setError(null);
      setListAppsRes(listAppsRes);
    } catch (error) {
      setDevicePermissionRequested(null);
      setError(error);
    }
  }, []);

  if (!transport) {
    return <ConnectDevice error={error} onConnect={onConnect} />;
  }

  if (!listAppsRes || !deviceInfo) {
    return (
      <ConnectDevice
        devicePermissionRequested={devicePermissionRequested}
        error={error}
        onConnect={onConnect}
        loading
      />
    );
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
  hidden: true,
};

export default Manager;
