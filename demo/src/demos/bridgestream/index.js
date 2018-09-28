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
    errorCorrectionLevel: "Q"
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

const checkArrayString = (m: mixed): string[] => {
  if (!Array.isArray(m)) throw new Error("JSON is not an array");
  const res = [];
  for (const item of m) {
    if (typeof item === "string") {
      res.push(item);
    }
  }
  return res;
};

const parseData = (inputValue: string): string[] =>
  checkArrayString(
    JSON.parse(atob(inputValue.trim().replace("BRIDGESTREAM_DATA=", "")))
  );

class BridgeStream extends Component<*, *> {
  state = {
    data: null,
    error: null
  };

  input = React.createRef();

  gifIt = () => {
    const qrcodes = document.getElementById("qrcodes");
    if (!qrcodes) throw new Error("no qrcodes");

    const gif = new window.GIF({
      workers: 2,
      quality: 10
    });

    const els = [...qrcodes.children];

    els.forEach(canvas => {
      gif.addFrame(canvas, { delay: 125 });
    });

    els.forEach(canvas => {
      gif.addFrame(canvas, { delay: 500 });
    });

    gif.on("finished", blob => {
      window.open(URL.createObjectURL(blob));
    });

    gif.render();
  };

  onSubmit = (evt: *) => {
    evt.preventDefault();
    const input = this.input.current;
    if (input) {
      try {
        const data = parseData(input.value);
        this.setState({ data, error: null });
        setTimeout(this.gifIt, 1000);
      } catch (error) {
        this.setState({ data: null, error });
      }
    }
  };

  render() {
    const { error, data } = this.state;
    if (data) {
      return (
        <div
          id="qrcodes"
          style={{
            flexDirection: "row",
            display: "flex",
            flexWrap: "wrap"
          }}
        >
          {data.map((data, i) => (
            <QRCode
              key={i}
              size={400}
              data={data}
              style={{
                margin: 40
              }}
            />
          ))}
        </div>
      );
    }
    return (
      <div>
        <form style={{ padding: 20 }} onSubmit={this.onSubmit}>
          <input
            autoFocus
            ref={this.input}
            style={{ padding: 8, width: 400 }}
            type="text"
            placeholder="Paste here the QRCode data logged in console"
          />
          <button name="print" style={{ padding: 8 }} type="submit">
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
  title: "BridgeStream",
  url: "/bridgestream"
};

export default BridgeStream;
