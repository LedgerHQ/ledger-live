import React, { Fragment, Component, useMemo } from "react";
import { ObjectInspector } from "react-inspector";
import ReactTable from "react-table";
import styled from "styled-components";
import "react-table/react-table.css";
import { AccountRaw } from "@ledgerhq/types-live";
import { decodeAccountId } from "@ledgerhq/coin-framework/lib/account/index";

export const getStaticProps = async () => ({ props: {} });

type Log = {
  type: string;
  level: string;
  pname: string;
  message: string;
  timestamp: string;
  index: number;
  error?: Error;
};
type LogMeta = {
  env: { [key: string]: string };
  userAgent: string;
  accountsIds: string[];
};

const shortAddressPreview = (addr: string, target = 20) => {
  const slice = Math.floor((target - 3) / 2);
  return addr.length < target - 3
    ? addr
    : `${addr.slice(0, slice)}...${addr.slice(addr.length - slice)}`;
};

const messageLenses: Record<string, (log: Log) => string> = {
  libcore: ({ message }) => {
    const i = message.indexOf("I: ");
    return i === -1 ? message : message.slice(i + 3);
  },
};

const Button = styled.a<{
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}>`
  cursor: pointer;
  padding: 12px 16px;
  border: none;
  background: ${p => (p.danger ? "#FF483820" : p.primary ? "#6490F1" : "rgba(100, 144, 241, 0.1)")};
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

const HeaderWrapper = styled.div``;
const HeaderRow = styled.div`
  display: flex;
  padding: 10px;
  > * + * {
    margin-right: 10px;
  }
`;

const Header = ({
  logs,
  logsMeta,
  onFiles,
}: {
  logs: Log[];
  logsMeta?: LogMeta;
  onFiles: (files: FileList) => void;
}) => {
  const apdusLogs = useMemo(
    () =>
      logs
        .slice(0)
        .reverse()
        .filter(l => l.type === "apdu")
        .reduce<Log[]>((all, l) => {
          const last = all[all.length - 1];
          if (last && last.message === l.message) return all;
          return all.concat(l);
        }, []),
    [logs],
  );
  const txSummaryLogs = useMemo(
    () =>
      logs
        .slice(0)
        .reverse()
        .filter(l => l.type === "transaction-summary"),
    [logs],
  );
  const apdus = apdusLogs.map(l => l.message).join("\n");
  const experimentalEnvs = useMemo(() => {
    const res: Array<{ key: string; value: string }> = [];
    if (logsMeta) {
      Object.keys(logsMeta.env).forEach(key => {
        if (key.includes("EXPERIMENTAL") && logsMeta.env[key]) {
          res.push({ key, value: logsMeta.env[key] });
        }
      });
    }
    return res;
  }, [logsMeta]);

  const href = useMemo(() => "data:text/plain;base64," + btoa(apdus), [apdus]);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    e.target.files && onFiles(e.target.files);
  const errors = logs.filter(l => l.error);
  const accountsIds = logsMeta?.accountsIds;

  let accounts: { data: AccountRaw }[] | undefined;
  try {
    accounts = accountsIds
      ?.map(id => {
        const { derivationMode, xpubOrAddress, currencyId } = decodeAccountId(id);
        const index = 0;
        const freshAddressPath = "0'/0'/0'/0/0"; // NB this is intentionally wrong. you are not in possession of this account.
        const data: AccountRaw = {
          id,
          seedIdentifier: xpubOrAddress,
          xpub: xpubOrAddress,
          derivationMode,
          index,
          freshAddress: xpubOrAddress,
          freshAddressPath,
          freshAddresses: [],
          name: currencyId + " " + shortAddressPreview(xpubOrAddress),
          starred: true,
          balance: "0",
          blockHeight: 0,
          currencyId,
          operations: [],
          pendingOperations: [],
          swapHistory: [],
          unitMagnitude: 0,
          lastSyncDate: "0",
        };
        return {
          data,
        };
      })
      .filter(Boolean);
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
                  accounts,
                },
              }),
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

      {txSummaryLogs.length === 0 ? null : (
        <HeaderRow>
          <details>
            <summary>
              <strong>{txSummaryLogs.length} transaction events</strong>
            </summary>
            <ul>
              {txSummaryLogs.map(
                ({ type, level, pname, message, timestamp, index: _index, ...rest }, i) => (
                  <li key={i}>
                    <pre>{message}</pre>
                    {Object.keys(rest).length > 0 ? <ObjectInspector data={rest} /> : null}
                  </li>
                ),
              )}
            </ul>
          </details>
        </HeaderRow>
      )}

      {experimentalEnvs.length ? (
        <HeaderRow>
          <details>
            <summary>
              <strong>experimental envs ({experimentalEnvs.length})</strong>
            </summary>
            <ul>
              {experimentalEnvs?.map((env, i) => (
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

const ContentCell = (props: { original: Log }) => {
  const log = props.original;
  const { type, level, pname, message: _msg, timestamp, index: _index, ...rest } = log; // eslint-disable-line no-unused-vars
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

class Logs extends Component<{
  logs: Log[];
}> {
  render() {
    const { logs } = this.props;
    // @ts-expect-error FIXME
    return <ReactTable defaultPageSize={logs.length} filterable data={logs} columns={columns} />;
  }
}

class HeaderEmptyState extends Component<{
  onFiles: (files: FileList) => void;
}> {
  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.files && this.props.onFiles(e.target.files);
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
          Select a <code>*.json</code> log exported from Ledger Live (<code>Ctrl+E</code> / Export
          Logs)
        </p>
        <p>
          <input type="file" onChange={this.onChange} accept=".json" />
        </p>
      </header>
    );
  }
}

class LogsViewer extends Component {
  state: {
    logs: Log[] | null;
  } = {
    logs: null,
  };
  onDragOver: React.DragEventHandler = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = "copy";
  };
  onDrop: React.DragEventHandler = evt => {
    evt.stopPropagation();
    evt.preventDefault();
    this.onFiles(evt.dataTransfer.files);
  };
  onFiles = (files: FileList) => {
    for (let i = 0, f; (f = files[i]); i++) {
      if (!f.type.match("application/json")) {
        continue;
      }
      const reader = new FileReader();
      reader.onload = e => {
        const txt = String(e.target?.result);
        let obj;
        try {
          obj = JSON.parse(txt);
        } catch (e) {
          obj = txt
            .split(/\n/g)
            .filter(Boolean)
            .map(str => JSON.parse(str));
        }
        const logs = (obj as Omit<Log, "index">[]).map((l, index) => ({
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
      <div style={{ minHeight: "100vh" }} onDragOver={this.onDragOver} onDrop={this.onDrop}>
        {!logs ? (
          <HeaderEmptyState onFiles={this.onFiles} />
        ) : (
          <>
            <Header
              onFiles={this.onFiles}
              logs={logs}
              logsMeta={logs.find(l => l.message === "exportLogsMeta") as LogMeta | undefined}
            />
            <Logs logs={logs} />
          </>
        )}
      </div>
    );
  }
}

export default LogsViewer;
