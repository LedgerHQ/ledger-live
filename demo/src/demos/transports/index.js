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
        Transport:{" "}<br/>
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

class ArbitraryAPDU extends Component<*,*> {
  state = {
    apdu: "",
    error: "",
    running: false,
    log: []
  };

  onClear = () => {
    this.setState({log:[]});
  };

  onClick = () => {
    const { transportId } = this.props;
    if (this.state.running) return;
    const apdu = this.state.apdu;
    this.setState(prevState => ({
      log: [...prevState.log, `=> ${apdu}`]
    }));
    this.setState({ running: true, error: null, result: "", apdu: "" });

    withDevice(transportId)(transport =>
      from(transport.exchange(Buffer.from(apdu, "hex")))
    ).subscribe({
      next: result => {
        this.setState(prevState => ({
          log: [...prevState.log, `<= ${result.toString("hex")}`,`<= ${result}`]
        }));
        this.setState({ running: false, error: null, result });
      },
      error: error => {
        this.setState(prevState => ({
          log: [...prevState.log, "<!= Error"]
        }));

        console.log(error);
        this.setState({ running: false, error, result: "" });
      }
    });
  }

  onChange = (event) => {
    this.setState({apdu:event.target.value});
  }

  render() {
    const { running } = this.state;
    return (
      <RightBar>
      <div><textarea style={{width:"100%"}} onChange={this.onChange} value={this.state.apdu} disabled={running} placeholder={"APDU"}/></div>
      <div>
        <button onClick={this.onClick} disabled={running} >Run APDU</button>
        <button onClick={this.onClear}>Clear log</button>
      </div>
      <div>
        <Log>
          {this.state.log.map(val=><pre>{val}</pre>)}
        </Log>
      </div>
      </RightBar>
    );
  }
}

class TextToData extends Component<*>{
  /**
   * The data we pass to the dongle follows something like {length}{hexData}
   * This is a little utility to convert raw text to/from that format
   */
  state = {
    value: "",
  };

  toData = () => {
    const hexString = Buffer.from(this.state.value).toString("hex");
    const contentLength = `${hexString.length/2}`.padStart(2,"0");
    this.setState({value:contentLength+hexString});
  }

  toText = () => {
    this.setState({value:Buffer.from(this.state.value.substr(2)).toString()});
  }

  render() {
    return (
      <div>
        <input type="text" onChange={(event)=>this.setState({value:event.target.value})} value={this.state.value}/>
        <button onClick={this.toData}>ToData</button>
        <button onClick={this.toText}>ToText</button>
      </div>
    )
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
  flex-direction:column;
  display:flex;
  padding: 40px;
  flex-shrink:1
  border-right:1px dashed gray; 
`;

const Wrapper = styled.div`
  flex-direction:row;
  display:flex;
`;
const RightBar = styled.div`
  padding: 40px;
  flex:1;
`;
const Log = styled.div`
  flex-grow:1;
  paddint:16px;
  background:#f3f3f3
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
      <Wrapper>
        <Main>
          <h1>APDU</h1>
          <SelectTransport value={transportId} onChange={this.onTransportId} />
          <h3>Tools</h3>
          <TextToData/>
          <GenuineCheckButton transportId={transportId} />
        </Main>
        <ArbitraryAPDU transportId={transportId}/>
      </Wrapper>
    );
  }
}

export default Transports;
