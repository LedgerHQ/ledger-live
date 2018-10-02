// @flow
import React, { PureComponent, Component } from "react";
import qrcode from "qrcode";

type Props = {
  data: string,
  errorCorrectionLevel: string,
  size: number,
  style?: *
};

const samplesSize = 60;
const fps = 20;
const introTime = 2000;
const benchTime = 5000;
const initialDataSize = 20;
const totalRound = 10;
const incrementDataSize = 40;
const size = 500;

class QRCode extends PureComponent<Props> {
  static defaultProps = {
    size,
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

class Benchmark extends PureComponent<*, *> {
  root = React.createRef();

  _raf: *;
  componentDidMount() {
    let i = 0;
    let lastT;
    const loop = t => {
      this._raf = requestAnimationFrame(loop);
      if (!lastT) lastT = t;
      if (t - lastT < 1000 / fps) return;
      lastT = t;
      const { current } = this.root;
      if (current) {
        current.children[i].style.opacity = 0;
        i = (i + 1) % samplesSize;
        current.children[i].style.opacity = 1;
      }
    };
    this._raf = requestAnimationFrame(loop);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this._raf);
  }

  render() {
    const { dataSize } = this.props;
    const randomDataSamples = Array(samplesSize)
      .fill(null)
      .map(() =>
        Array(dataSize)
          .fill(null)
          .map(() => String.fromCharCode(Math.floor(256 * Math.random())))
          .join("")
      );
    return (
      <div
        ref={this.root}
        style={{ position: "relative", width: size, height: size }}
      >
        {randomDataSamples.map((data, i) => (
          <QRCode
            key={i}
            data={data}
            style={{ position: "absolute", top: 0, left: 0, opacity: 0 }}
          />
        ))}
      </div>
    );
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class BridgeStream extends Component<*, *> {
  state = {
    dataSize: initialDataSize,
    p: 0,
    intro: true,
    ready: false,
    end: false
  };

  onGo = async () => {
    this.setState({ ready: true });
    for (let i = 0; i < totalRound; i++) {
      await delay(introTime);
      this.setState({ p: (i + 1) / totalRound, intro: false });
      await delay(benchTime);
      this.setState({ intro: true });
      this.setState({
        dataSize: initialDataSize + (i + 1) * incrementDataSize
      });
    }
    this.setState({ end: true });
  };

  render() {
    const { dataSize, ready, intro, end, p } = this.state;

    return (
      <div
        style={{
          display: "flex",
          textAlign: "center",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100vw",
          height: "100vh",
          padding: 20,
          boxSizing: "border-box"
        }}
      >
        <div style={{ height: 80, maxWidth: 800 }}>
          {end ? (
            <div>{"That's all folks!"}</div>
          ) : ready ? (
            <progress value={p} min={0} max={1} />
          ) : (
            <div>
              Move this page to fullscreen. Make sure you run on Phone in
              Release mode and that wires are detached. go to Settings/Benchmark
              QRStream. Move the camera so the QRCode is exactly inside the
              white rectangle. There must be no reflection on the computer
              screen. You will have to stay for about 1 minute on the same
              position. When the benchmark is done, please copy paste the
              result. When you{"'"}re ready click on:{" "}
              <button onClick={this.onGo}>READY</button>
            </div>
          )}
        </div>
        <div
          style={{
            position: "relative",
            width: size,
            height: size,
            margin: 50,
            display: "inline-block"
          }}
        >
          <Benchmark dataSize={dataSize} />
          {end ? (
            <QRCode
              data="end"
              style={{ position: "absolute", top: 0, left: 0 }}
            />
          ) : intro ? (
            <QRCode
              data={`bench:${dataSize}`}
              style={{ position: "absolute", top: 0, left: 0 }}
            />
          ) : null}
        </div>
      </div>
    );
  }
}

// $FlowFixMe
BridgeStream.demo = {
  title: "QRStream benchmark",
  url: "/qrstreambenchmark"
};

export default BridgeStream;
