// @flow
import React, { PureComponent, Component } from "react";
import qrcode from "qrcode";

type Props = {
  data: string,
  errorCorrectionLevel: string,
  size: number,
  style?: *
};

class QRCode extends PureComponent<Props> {
  static defaultProps = {
    size: 200,
    errorCorrectionLevel: "H"
  };

  componentDidMount() {
    this.drawQRCode();
  }

  componentDidUpdate() {
    this.drawQRCode();
  }

  _canvas = null;

  drawQRCode() {
    const { data, size, errorCorrectionLevel } = this.props;
    qrcode.toCanvas(this._canvas, data, {
      width: size,
      margin: 0,
      errorCorrectionLevel,
      color: {
        light: "#ffffff"
      }
    });
  }

  render() {
    return <canvas style={this.props.style} ref={n => (this._canvas = n)} />;
  }
}

type Entry = {
  name: string,
  address: string
};

const parseData = (inputValue: string): Entry[] => {
  const all = [];
  inputValue.split("\n").forEach(row => {
    const splits = row.split(/\s+/g).filter(a => a);
    if (splits.length >= 2) {
      const name = splits.slice(0, splits.length - 1).join(" ");
      const address = splits[splits.length - 1];
      console.log({ name, address });
      all.push({ name, address });
    }
  });
  return all;
};

class QRCodeEntry extends Component<*> {
  render() {
    const { entry, width } = this.props;
    return (
      <div
        className="printbreakinside"
        style={{ display: "inline-block", textAlign: "center" }}
      >
        <h1
          style={{
            display: "block",
            textAlign: "center",
            fontSize: Math.round(width / 15) + "px",
            color: "#000"
          }}
        >
          {entry.name}
        </h1>
        <div
          style={{
            fontFamily: "monospace",
            textAlign: "center",
            fontSize: Math.round(width / 15) + "px",
            color: "#666",
            maxWidth: width,
            wordBreak: "break-all"
          }}
        >
          {entry.address}
        </div>
        <div
          style={{
            position: "relative",
            margin: width / 10,
            width
          }}
        >
          <QRCode size={width} data={entry.address} />
          <img
            alt=""
            src="/ledger_icon.svg"
            style={{
              width: width / 4,
              height: width / 4,
              position: "absolute",
              top: width / 3,
              left: width / 3,
              padding: width / 16,
              background: "white"
            }}
          />
        </div>
      </div>
    );
  }
}

class BridgeStream extends Component<*, *> {
  state = {
    data: null,
    error: null,
    width: 400
  };

  input = React.createRef();

  onSubmit = (evt: *) => {
    evt.preventDefault();
    const input = this.input.current;
    if (input) {
      try {
        const data = parseData(input.value);
        this.setState({ data, error: null });
      } catch (error) {
        this.setState({ data: null, error });
      }
    }
  };

  render() {
    const { error, data, width } = this.state;
    if (data) {
      return (
        <div>
          {data.map((entry, i) => (
            <QRCodeEntry key={i} width={width} entry={entry} />
          ))}
        </div>
      );
    }
    return (
      <div>
        <form
          style={{
            padding: 20,
            flexDirection: "column",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onSubmit={this.onSubmit}
        >
          <textarea
            autoFocus
            ref={this.input}
            style={{ margin: 20, padding: 10, width: 400, minHeight: 400 }}
            type="text"
            placeholder={`Paste here a list of <Person Name> <address> and click on Generate\n\nExample:\n\nGaëtan Renaudeau    1greABCDEFGHIJQL\nMark Someone    1markABCDEFGHIJQL\n...`}
          />
          <input
            type="number"
            value={width}
            onChange={e => this.setState({ width: parseInt(e.target.value) })}
          />
          <button
            name="print"
            style={{ marginTop: 20, padding: 8 }}
            type="submit"
          >
            GENERATE
          </button>
        </form>
        <div style={{ color: "#D00" }}>{error ? String(error) : null}</div>
      </div>
    );
  }
}

// $FlowFixMe
BridgeStream.demo = {
  title: "QR addresses Ledger Generator",
  url: "/qrledger",
  hidden: true
};

export default BridgeStream;
