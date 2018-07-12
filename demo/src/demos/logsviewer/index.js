// @flow
import React, { Component, PureComponent } from "react";
import { ObjectInspector } from "react-inspector";
import styled from "styled-components";

const Table = styled.table``;

const TableHead = styled.thead`
  td {
    font-weight: bold;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  opacity: ${p => (p.level === "debug" ? 0.7 : 1)};
  color: ${p =>
    p.level === "error" ? "#C00" : p.level === "warn" ? "#F90" : "#000"};
`;

const TableCell = styled.td``;

const messageLenses = {
  libcore: ({ message }) => {
    const i = message.indexOf("I: ");
    return i === -1 ? message : message.slice(i + 3);
  }
};

const formatDT = dt => {
  const v = Math.abs(dt);
  let sec = v / 1000;
  let str;
  if (sec < 60) str = sec.toFixed(3) + "s";
  else {
    const min = Math.floor(sec / 60);
    sec -= 60 * min;
    sec = Math.floor(sec);
    str = min + "m " + (sec > 9 ? sec : "0" + sec) + "s";
  }
  return str;
};

class Log extends PureComponent<*> {
  render() {
    const { log, referenceTime } = this.props;
    const { type, level, pname, message: _msg, timestamp, ...rest } = log; // eslint-disable-line no-unused-vars
    const messageLense = messageLenses[type];
    const message = messageLense ? messageLense(log) : log.message;
    const deltaT = new Date(timestamp) - referenceTime;
    return (
      <TableRow level={level}>
        <TableCell title={deltaT} style={{ whiteSpace: "nowrap" }}>
          {formatDT(deltaT)}
        </TableCell>
        <TableCell>{pname}</TableCell>
        <TableCell>{type}</TableCell>
        <TableCell>
          <code>{message}</code>
          {Object.keys(rest).length > 0 ? (
            <ObjectInspector data={rest} />
          ) : null}
        </TableCell>
      </TableRow>
    );
  }
}

class Logs extends Component<*> {
  render() {
    const { logs } = this.props;
    const referenceTime = new Date(logs[0].timestamp);
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>time</TableCell>
            <TableCell>process</TableCell>
            <TableCell>type</TableCell>
            <TableCell>content</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log, i) => (
            <Log key={i} referenceTime={referenceTime} log={log} />
          ))}
        </TableBody>
      </Table>
    );
  }
}

class HeaderEmptyState extends Component<*> {
  render() {
    return (
      <header>
        <div>
          Welcome to{" "}
          <span>
            Ledger <strong>Live</strong>
          </span>{" "}
          Log Viewer
        </div>
        <div>
          Drag & Drop here a <code>*.json</code> log file that was exported from
          Ledger Live with <code>Ctrl+E</code> (or Export Logs)
        </div>
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
    var files = evt.dataTransfer.files;
    for (var i = 0, f; (f = files[i]); i++) {
      if (!f.type.match("application/json")) {
        continue;
      }
      var reader = new FileReader();
      reader.onload = e => {
        const logs = JSON.parse(e.target.result);
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
        {!logs ? <HeaderEmptyState /> : <Logs logs={logs} />}
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
