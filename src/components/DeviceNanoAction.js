import React, { PureComponent } from "react";
import Svg, {
  Defs,
  Rect,
  LinearGradient,
  Stop,
  G,
  Path,
  Ellipse,
} from "react-native-svg";

class DeviceNanoAction extends PureComponent<{
  powerAction?: boolean,
  action?: boolean,
  screen?: "validation" | "home",
  width: number,
  error?: Error,
}> {
  static defaultProps = {
    width: 272,
  };

  render() {
    const { powerAction, error, action, screen, width } = this.props;

    const color = error ? "#EA2E49" : "#6490F1";
    const isRefusal = error && error.name.startsWith("UserRefused");

    return (
      <Svg width={width} height={(width * 88) / 272} viewBox="0 0 272 88">
        <Defs>
          <LinearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="prefix__a">
            <Stop stopColor="#4F87FF" stopOpacity={0} offset="0%" />
            <Stop stopColor="#4B84FF" offset="100%" />
          </LinearGradient>
        </Defs>
        <G fill="none" fillRule="evenodd">
          <Path fill="#FFF" d="M0 0h272v88H0z" />
          <G transform="rotate(-90 44.064 43.52)">
            <Path
              d="M11.648 1.153c-5.796 0-10.495 4.699-10.495 10.495v227.983c0 5.796 4.699 10.495 10.495 10.495h20.113c5.796 0 10.495-4.7 10.495-10.495V11.648c0-5.796-4.699-10.495-10.495-10.495H11.648z"
              stroke="#142533"
              strokeWidth={2.306}
              fillOpacity={0.12}
              fill={color}
            />
            <Path
              d="M21.677 116.419c-11.335 0-20.524 9.189-20.524 20.524v114.321c0 5.796 4.699 10.495 10.495 10.495h20.113c5.796 0 10.495-4.699 10.495-10.495V136.943c0-11.335-9.189-20.524-20.524-20.524h-.055z"
              stroke="#1D2027"
              strokeWidth={2.306}
              fill="#FFF"
            />
            <Ellipse
              stroke="#1D2027"
              strokeWidth={1.048}
              fill="#FFF"
              cx={21.705}
              cy={136.951}
              rx={11.545}
              ry={11.535}
            />
            <Ellipse
              stroke="#1D2027"
              strokeWidth={1.048}
              cx={21.705}
              cy={21.782}
              rx={11.545}
              ry={11.535}
            />
          </G>
          <G transform="translate(43 54)">
            <Rect
              stroke={color}
              strokeWidth={0.832}
              fillOpacity={0.5}
              fill="#FFF"
              fillRule="nonzero"
              x={0.416}
              y={0.416}
              width={64.168}
              height={22.168}
              rx={2.5}
            />
            {error && isRefusal ? (
              <Path
                d="M54.443 11.5l3.098-3.098a.286.286 0 0 0 0-.405l-.538-.538a.286.286 0 0 0-.405 0L53.5 10.557l-3.098-3.098a.286.286 0 0 0-.405 0l-.538.538a.286.286 0 0 0 0 .405l3.098 3.098-3.098 3.098a.286.286 0 0 0 0 .405l.538.538a.286.286 0 0 0 .405 0l3.098-3.098 3.098 3.098a.286.286 0 0 0 .405 0l.538-.538a.286.286 0 0 0 0-.405L54.443 11.5z"
                fill="#EA2E49"
                fillRule="nonzero"
              />
            ) : null}
            {screen === "validation" ? (
              <Path
                d="M57.364 7.793l-5.651 5.652-2.077-2.077c-.1-.1-.264-.1-.365 0l-.607.608c-.1.1-.1.264 0 .364l2.866 2.867c.1.1.264.1.365 0l6.441-6.442c.1-.1.1-.263 0-.364l-.607-.608c-.101-.1-.264-.1-.365 0z"
                fill="#0EBDCB"
              />
            ) : screen === "home" ? (
              <Path
                d="M49.89 10.377v4.79c0 .221.18.4.402.4h6.416c.222 0 .401-.179.401-.4v-4.79L53.5 7.57l-3.61 2.807zm-.832-.659l4.125-3.208a.516.516 0 0 1 .634 0l4.125 3.208c.125.098.199.248.199.407v5.042c0 .79-.642 1.432-1.433 1.432h-6.416a1.432 1.432 0 0 1-1.433-1.432v-5.042c0-.16.074-.31.2-.407zm3.583 2.298v4.067a.516.516 0 1 1-1.032 0V11.5c0-.285.231-.516.516-.516h2.75c.285 0 .516.231.516.516v4.583a.516.516 0 1 1-1.032 0v-4.067h-1.718z"
                fill="#0EBDCB"
                fillRule="nonzero"
              />
            ) : null}
          </G>
          {!action ? null : (
            <G transform="translate(132)">
              <Ellipse
                strokeOpacity={0.6}
                stroke="#4B84FF"
                strokeWidth={0.5}
                fillOpacity={0.2}
                fill="#4B84FF"
                cx={4.854}
                cy={65.635}
                rx={4.96}
                ry={4.989}
              />
              <Ellipse
                stroke="#4B84FF"
                strokeWidth={0.725}
                fill="#4B84FF"
                cx={4.854}
                cy={65.635}
                rx={1.811}
                ry={1.823}
              />
              <Path
                fill="url(#prefix__a)"
                fillRule="nonzero"
                d="M5.463 66.532h-1.16V.001L5.464 0z"
              />
            </G>
          )}
          {!powerAction ? null : (
            <G transform="translate(17.272)">
              <Ellipse
                strokeOpacity={0.6}
                stroke="#4B84FF"
                strokeWidth={0.5}
                fillOpacity={0.2}
                fill="#4B84FF"
                cx={4.854}
                cy={65.635}
                rx={4.96}
                ry={4.989}
              />
              <Ellipse
                stroke="#4B84FF"
                strokeWidth={0.725}
                fill="#4B84FF"
                cx={4.854}
                cy={65.635}
                rx={1.811}
                ry={1.823}
              />
              <Path
                fill="url(#prefix__a)"
                fillRule="nonzero"
                d="M5.463 66.532h-1.16V.001L5.464 0z"
              />
            </G>
          )}
          {!error ? null : (
            <G transform="translate(240 34)">
              <Path
                d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16z"
                fill="#FFF"
                fillRule="nonzero"
              />
              <Path
                d="M16 28C9.373 28 4 22.627 4 16S9.373 4 16 4s12 5.373 12 12-5.373 12-12 12z"
                fill="#EA2E49"
              />
              {isRefusal ? (
                <Path
                  fill="#FFF"
                  fillRule="nonzero"
                  d="M17.029 16l3.38-3.38a.312.312 0 0 0 0-.441l-.588-.587a.312.312 0 0 0-.441 0L16 14.972l-3.38-3.38a.312.312 0 0 0-.441 0l-.587.587a.312.312 0 0 0 0 .441l3.38 3.38-3.38 3.38a.312.312 0 0 0 0 .441l.587.587c.122.123.32.123.441 0l3.38-3.38 3.38 3.38c.122.123.32.123.441 0l.587-.587a.312.312 0 0 0 0-.441L17.028 16z"
                />
              ) : (
                <Path
                  d="M16.85 17.499h-1.673l-.35-6.299H17.2l-.35 6.299zm-2.05 2.205c0-.361.103-.634.309-.819.205-.185.505-.277.898-.277.38 0 .673.094.881.284.208.189.312.46.312.812 0 .34-.105.607-.315.803-.21.195-.503.293-.878.293-.384 0-.681-.096-.892-.287-.21-.191-.315-.46-.315-.809z"
                  fill="#FFF"
                />
              )}
            </G>
          )}
        </G>
      </Svg>
    );
  }
}

export default DeviceNanoAction;
