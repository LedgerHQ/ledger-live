import React, { PureComponent } from "react";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  G,
  Path,
  Ellipse,
} from "react-native-svg";

class DeviceNanoAction extends PureComponent<{
  powerAction?: boolean,
  action?: boolean,
  validationOnScreen?: boolean,
  width: number,
}> {
  static defaultProps = {
    width: 318,
  };

  render() {
    const { powerAction, action, validationOnScreen, width } = this.props;
    return (
      <Svg width={width} height={(width * 93) / 318} viewBox="0 0 318 93">
        <Defs>
          <LinearGradient id="a" x1="50%" x2="50%" y1="0%" y2="63.541%">
            <Stop offset="0%" stopColor="#6490F1" stopOpacity={0} />
            <Stop offset="100%" stopColor="#6490F1" />
          </LinearGradient>
        </Defs>
        <G fill="none" fillRule="evenodd">
          <Path
            fill="#142533"
            fillRule="nonzero"
            d="M157 44.117c-.534.12-1.063.26-1.586.417-9.837 2.957-16.682 11.926-16.682 22.2 0 12.64 10.271 22.927 23.057 23.201h1.273v.006h146.372a5.442 5.442 0 0 0 5.442-5.442V48.968a5.442 5.442 0 0 0-5.442-5.442H171v-3h138.434a8.442 8.442 0 0 1 8.442 8.442v35.53a8.442 8.442 0 0 1-8.442 8.443H162.312c-.185 0-.37-.002-.555-.006H8.775a8.442 8.442 0 0 1-8.442-8.442V48.962a8.442 8.442 0 0 1 8.442-8.442h147.972v.581l.253-.052v3.068zm0 8.506v1.692c-4.352 2.423-7.295 7.062-7.295 12.387 0 7.829 6.362 14.176 14.21 14.176 7.848 0 14.209-6.347 14.209-14.176 0-5.255-2.866-9.842-7.124-12.29v-1.704c5.116 2.584 8.624 7.88 8.624 13.994 0 8.658-7.034 15.676-15.71 15.676-8.675 0-15.709-7.018-15.709-15.676 0-6.182 3.586-11.527 8.795-14.08zm-7.042-9.103H8.775a5.442 5.442 0 0 0-5.442 5.442v35.531a5.442 5.442 0 0 0 5.442 5.442H149.94c-8.447-4.388-14.209-13.13-14.209-23.202 0-9.932 5.652-18.775 14.226-23.213zM42.478 66.962c0 8.657-7.034 15.675-15.71 15.675-8.675 0-15.71-7.018-15.71-15.675 0-8.658 7.035-15.676 15.71-15.676 8.676 0 15.71 7.018 15.71 15.676zm-1.5 0c0-7.829-6.362-14.176-14.21-14.176-7.848 0-14.21 6.347-14.21 14.176 0 7.828 6.362 14.175 14.21 14.175 7.848 0 14.21-6.347 14.21-14.175z"
          />
          {powerAction ? (
            <G transform="translate(155.7 -.2)">
              <Ellipse
                cx={8.24}
                cy={67.061}
                fill="#4B84FF"
                fillOpacity={0.2}
                rx={7.725}
                ry={7.675}
              />
              <G transform="translate(5.34)">
                <Ellipse
                  cx={2.836}
                  cy={67.125}
                  fill="#6490F1"
                  rx={2.809}
                  ry={2.791}
                />
                <Path
                  fill="url(#a)"
                  fillRule="nonzero"
                  d="M3.824 69.176H1.892V.02h1.932z"
                />
              </G>
            </G>
          ) : null}
          {action ? (
            <G transform="translate(18.7 -.2)">
              <Ellipse
                cx={8.24}
                cy={67.061}
                fill="#4B84FF"
                fillOpacity={0.2}
                rx={7.725}
                ry={7.675}
              />
              <G transform="translate(5.34)">
                <Ellipse
                  cx={2.836}
                  cy={67.125}
                  fill="#6490F1"
                  rx={2.809}
                  ry={2.791}
                />
                <Path
                  fill="url(#a)"
                  fillRule="nonzero"
                  d="M3.824 69.176H1.892V.02h1.932z"
                />
              </G>
            </G>
          ) : null}
          {validationOnScreen ? (
            <G fillRule="nonzero">
              <Path
                fill="#6490F1"
                fillOpacity={0.2}
                d="M51.5 77.5a2 2 0 0 0 2 2h70a2 2 0 0 0 2-2v-21a2 2 0 0 0-2-2h-70a2 2 0 0 0-2 2v21zm-1 0v-21a3 3 0 0 1 3-3h70a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3h-70a3 3 0 0 1-3-3z"
              />
              <Path
                fill="#66BE54"
                d="M116.215 62.956l-6.165 6.165-2.265-2.265a.281.281 0 0 0-.398 0l-.663.663a.281.281 0 0 0 0 .398l3.127 3.127c.11.11.288.11.398 0l7.027-7.027a.281.281 0 0 0 0-.398l-.663-.663a.281.281 0 0 0-.398 0z"
              />
            </G>
          ) : null}
        </G>
      </Svg>
    );
  }
}

export default DeviceNanoAction;
