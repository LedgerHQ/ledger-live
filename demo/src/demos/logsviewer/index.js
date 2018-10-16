// @flow
import React, { Fragment, Component } from "react";
import { ObjectInspector } from "react-inspector";
import ReactTable from "react-table";
import "react-table/react-table.css";

const messageLenses = {
  libcore: ({ message }) => {
    const i = message.indexOf("I: ");
    return i === -1 ? message : message.slice(i + 3);
  }
};

const ContentCell = (props: *) => {
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
    maxWidth: 80
  },
  {
    id: "time",
    Header: "time",
    accessor: "timestamp",
    maxWidth: 220
  },
  {
    Header: "process",
    accessor: "pname",
    maxWidth: 100
  },
  {
    Header: "type",
    accessor: "type",
    maxWidth: 150
  },
  {
    id: "content",
    Header: "Content",
    accessor: "message",
    Cell: ContentCell
  }
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
          Select a <code>*.json</code> log exported from Ledger Live (<code>
            Ctrl+E
          </code>{" "}
          / Export Logs)
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
    logs: null
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
      reader.onload = e => {
        const logs = JSON.parse(e.target.result).map((l, index) => ({
          index,
          ...l
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
          <Logs logs={logs} />
        )}
      </div>
    );
  }
}

// $FlowFixMe
LogsViewer.demo = {
  title: "Logs viewer",
  url: "/logsviewer"
};

export default LogsViewer;
