// @flow
import React, { Component } from "react";
import styled from "styled-components";
import { from } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import genuineCheck from "@ledgerhq/live-common/lib/hw/genuineCheck";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";

const transports = ["webusb", "webble"];

// ~~~ UI ~~~

class SelectTransport extends Component<*> {
  onChange = e => {
    this.props.onChange(e.target.value);
  };
  render() {
    return (
      <label>
        Transport:{" "}
        <select onChange={this.onChange} value={this.props.value}>
          {transports.map(key => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </label>
    );
  }
}

class GenuineCheckButton extends Component<*, *> {
  state = {
    running: false,
    error: null,
    result: ""
  };

  onClick = () => {
    const { transportId } = this.props;
    if (this.state.running) return;
    this.setState({ running: true, error: null, result: "" });

    withDevice(transportId)(transport =>
      from(getDeviceInfo(transport)).pipe(
        mergeMap(deviceInfo => genuineCheck(transport, deviceInfo))
      )
    ).subscribe({
      next: result => {
        this.setState({ running: false, error: null, result });
      },
      error: error => {
        this.setState({ running: false, error, result: "" });
      }
    });
  };

  render() {
    const { running, error, result } = this.state;
    return (
      <p>
        <button onClick={this.onClick} disabled={running}>
          Do the Genuine Check
        </button>
        {running ? <em>...</em> : null}
        <em style={{ color: "red" }}>{error && error.message}</em>
        <strong>{result}</strong>
      </p>
    );
  }
}

const Main = styled.div`
  padding: 40px;
`;

class Transports extends Component<*, *> {
  static demo = {
    title: "Transports",
    url: "/transports"
  };

  state = {
    transportId: "webusb"
  };

  onTransportId = (transportId: string) => {
    this.setState({ transportId });
  };

  render() {
    const { transportId } = this.state;
    return (
      <Main>
        <SelectTransport value={transportId} onChange={this.onTransportId} />
        <GenuineCheckButton transportId={transportId} />
      </Main>
    );
  }
}

export default Transports;
