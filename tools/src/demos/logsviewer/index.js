// @flow
import React, { Fragment, Component, useMemo } from "react";
import { ObjectInspector } from "react-inspector";
import ReactTable from "react-table";
import styled from "styled-components";
import "react-table/react-table.css";
import { BigNumber } from "bignumber.js";
import {
  decodeAccountId,
  toAccountRaw,
} from "@ledgerhq/live-common/lib/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/currencies";
import { shortAddressPreview } from "@ledgerhq/live-common/lib/account/helpers";
import {
  runDerivationScheme,
  getDerivationScheme,
} from "@ledgerhq/live-common/lib/derivation";

const messageLenses = {
  libcore: ({ message }) => {
    const i = message.indexOf("I: ");
    return i === -1 ? message : message.slice(i + 3);
  },
};

const Button = styled.a`
  cursor: pointer;
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

const HeaderWrapper = styled.div``;
const HeaderRow = styled.div`
  display: flex;
  padding: 10px;
  > * + * {
    margin-right: 10px;
  }
`;

const Header = ({ logs, logsMeta, onFiles }: *) => {
  const apdusLogs = useMemo(
    () =>
      logs
        .slice(0)
        .reverse()
        .filter((l) => l.type === "apdu")
        .reduce((all, l) => {
          const last = all[all.length - 1];
          if (last && last.message === l.message) return all;
          return all.concat(l);
        }, []),
    [logs]
  );
  const apdus = apdusLogs.map((l) => l.message).join("\n");
  const experimentalEnvs = useMemo(
    () =>
      logsMeta
        ? Object.keys(logsMeta.env)
            .map((key) => {
              if (key.includes("EXPERIMENTAL")) {
                return { key, value: logsMeta.env[key] };
              }
              return null;
            })
            .filter((env) => !!env && !!env.value)
        : [],
    [logsMeta]
  );
  const href = useMemo(() => "data:text/plain;base64," + btoa(apdus), [apdus]);
  const onChange = (e: *) => onFiles(e.target.files);
  const errors = logs.filter((l) => l.error);
  const accountsIds = logsMeta?.accountsIds;
  let accounts;
  try {
    accounts = accountsIds.map((id) => {
      const { derivationMode, xpubOrAddress, currencyId } = decodeAccountId(id);
      const currency = getCryptoCurrencyById(currencyId);
      const scheme = getDerivationScheme({
        derivationMode,
        currency,
      });
      const index = 0;
      const freshAddressPath = runDerivationScheme(scheme, currency, {
        account: index,
        node: 0,
        address: 0,
      });

      return {
        type: "Account",
        name:
          currency.name +
          " " +
          (derivationMode || "legacy") +
          " " +
          shortAddressPreview(xpubOrAddress),
        xpub: xpubOrAddress,
        seedIdentifier: xpubOrAddress,
        starred: true,
        swapHistory: [],
        id,
        derivationMode,
        currency,
        unit: currency.units[0],
        index,
        freshAddress: xpubOrAddress,
        freshAddressPath,
        freshAddresses: [],
        creationDate: new Date(),
        lastSyncDate: new Date(0),
        blockHeight: 0,
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
        operationsCount: 0,
        operations: [],
        pendingOperations: [],
      };
    });
  } catch (e) {
    console.error(e);
  }

  const appJsonHref = useMemo(() => {
    try {
      return !accounts
        ? ""
        : "data:text/plain;base64," +
            btoa(
              JSON.stringify({
                data: {
                  settings: { hasCompletedOnboarding: true },
                  user: { id: "_" },
                  accounts: accounts.map((a) => ({ data: toAccountRaw(a) })),
                },
              })
            );
    } catch (e) {
      console.error(e);
    }
  }, [accounts]);

  return (
    <HeaderWrapper>
      <HeaderRow>
        <input type="file" onChange={onChange} accept=".json" />

        {apdusLogs.length ? (
          <Button download="apdus" href={href}>
            {apdusLogs.length} APDUs
          </Button>
        ) : null}

        <Button download="app.json" href={appJsonHref}>
          app.json with user accounts
        </Button>
      </HeaderRow>

      {logsMeta ? (
        <HeaderRow>
          <strong>user is on</strong> {logsMeta.userAgent}
        </HeaderRow>
      ) : null}

      {accountsIds ? (
        <HeaderRow>
          <details>
            <summary>
              <strong>user have {accountsIds.length} accounts</strong>
            </summary>
            <ul>
              {accountsIds.map((id, i) => (
                <li key={i}>
                  <pre>
                    <code>{id}</code>
                  </pre>
                </li>
              ))}
            </ul>
          </details>
        </HeaderRow>
      ) : null}

      <HeaderRow>
        <details>
          <summary>
            <strong>this logs have {errors.length} errors</strong>
          </summary>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>
                <ObjectInspector data={e.error} expandLevel={3} />
              </li>
            ))}
          </ul>
        </details>
      </HeaderRow>

      {experimentalEnvs.length ? (
        <HeaderRow>
          <details>
            <summary>
              <strong>experimental envs ({experimentalEnvs.length})</strong>
            </summary>
            <ul>
              {experimentalEnvs.map((env, i) => (
                <li key={i}>
                  <pre>
                    <code>{`${env.key}: ${env.value}`}</code>
                  </pre>
                </li>
              ))}
            </ul>
          </details>
        </HeaderRow>
      ) : null}
    </HeaderWrapper>
  );
};

const ContentCell = (props: *) => {
  const log = props.original;
  const {
    type,
    level,
    pname,
    message: _msg,
    timestamp,
    index: _index,
    ...rest
  } = log; // eslint-disable-line no-unused-vars
  const messageLense = messageLenses[type];
  const message = messageLense ? messageLense(log) : log.message;
  return (
    <Fragment>
      <code>{message}</code>
      {Object.keys(rest).length > 0 ? <ObjectInspector data={rest} /> : null}
    </Fragment>
  );
};

const columns = [
  {
    id: "index",
    Header: "index",
    accessor: "index",
    minWidth: 80,
    maxWidth: 80,
  },
  {
    id: "time",
    Header: "time",
    accessor: "timestamp",
    maxWidth: 220,
  },
  {
    Header: "process",
    accessor: "pname",
    maxWidth: 100,
  },
  {
    Header: "type",
    accessor: "type",
    maxWidth: 150,
  },
  {
    id: "content",
    Header: "Content",
    accessor: "message",
    Cell: ContentCell,
  },
];

/*
const getTrProps = (state, p) => {
  if (!p) return;
  const { original } = p;
  return {
    style: {
      opacity: original.level === "debug" ? 0.7 : 1,
      color:
        original.level === "error"
          ? "#C00"
          : original.level === "warn"
            ? "#F90"
            : "#000"
    }
  };
};
*/

class Logs extends Component<*> {
  render() {
    const { logs } = this.props;
    return (
      <ReactTable
        defaultPageSize={logs.length}
        filterable
        data={logs}
        columns={columns}
      />
    );
  }
}

class HeaderEmptyState extends Component<*> {
  onChange = (e: *) => {
    this.props.onFiles(e.target.files);
  };
  render() {
    return (
      <header style={{ padding: 20 }}>
        <h1>
          Welcome to{" "}
          <span>
            Ledger <strong>Live</strong>
          </span>{" "}
          LogsViewer
        </h1>
        <p>
          Select a <code>*.json</code> log exported from Ledger Live (
          <code>Ctrl+E</code> / Export Logs)
        </p>
        <p>
          <input type="file" onChange={this.onChange} accept=".json" />
        </p>
      </header>
    );
  }
}

class LogsViewer extends Component<*, *> {
  state = {
    logs: null,
  };
  onDragOver = (evt: *) => {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "copy";
  };
  onDrop = (evt: *) => {
    evt.stopPropagation();
    evt.preventDefault();
    this.onFiles(evt.dataTransfer.files);
  };
  onFiles = (files: *) => {
    for (var i = 0, f; (f = files[i]); i++) {
      if (!f.type.match("application/json")) {
        continue;
      }
      var reader = new FileReader();
      reader.onload = (e) => {
        const txt = e.target.result;
        let obj;
        try {
          obj = JSON.parse(txt);
        } catch (e) {
          obj = txt
            .split(/\n/g)
            .filter(Boolean)
            .map((str) => JSON.parse(str));
        }
        const logs = obj.map((l, index) => ({
          index,
          ...l,
        }));
        console.log({ logs }); // eslint-disable-line no-console
        this.setState({ logs });
      };
      reader.readAsText(f);
    }
  };
  render() {
    const { logs } = this.state;
    return (
      <div
        style={{ minHeight: "100vh" }}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}
      >
        {!logs ? (
          <HeaderEmptyState onFiles={this.onFiles} />
        ) : (
          <>
            <Header
              onFiles={this.onFiles}
              logs={logs}
              logsMeta={logs.find((l) => l.message === "exportLogsMeta")}
            />
            <Logs logs={logs} />
          </>
        )}
      </div>
    );
  }
}

// $FlowFixMe
LogsViewer.demo = {
  title: "Logs viewer",
  url: "/logsviewer",
};

export default LogsViewer;
