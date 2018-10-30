import React, { PureComponent } from "react";
import Svg, { G, Path, Rect, Ellipse } from "react-native-svg";

export default class RejectedImage extends PureComponent<{
  size: number,
}> {
  render() {
    const { size } = this.props;

    return (
      <Svg width={size} height={size / 5} viewBox="0 0 272 54" {...this.props}>
        <G fill="none" fillRule="evenodd">
          <Path
            d="M1.697 41.936c0 5.796 4.699 10.495 10.495 10.495h227.983c5.796 0 10.495-4.699 10.495-10.495V21.823c0-5.796-4.7-10.495-10.495-10.495H12.192c-5.796 0-10.495 4.699-10.495 10.495v20.113z"
            stroke="#142533"
            strokeWidth={2.306}
            fillOpacity={0.12}
            fill="#EA2E49"
          />
          <Path
            d="M116.963 31.907c0 11.335 9.189 20.524 20.524 20.524h114.321c5.796 0 10.495-4.699 10.495-10.495V21.823c0-5.796-4.699-10.495-10.495-10.495H137.487c-11.335 0-20.524 9.189-20.524 20.524v.055z"
            stroke="#1D2027"
            strokeWidth={2.306}
            fill="#FFF"
          />
          <Ellipse
            stroke="#1D2027"
            strokeWidth={1.048}
            fill="#FFF"
            transform="rotate(-90 137.495 31.88)"
            cx={137.495}
            cy={31.879}
            rx={11.545}
            ry={11.535}
          />
          <Ellipse
            stroke="#1D2027"
            strokeWidth={1.048}
            transform="rotate(-90 22.326 31.88)"
            cx={22.326}
            cy={31.879}
            rx={11.545}
            ry={11.535}
          />
          <Rect
            stroke="#EA2E49"
            strokeWidth={0.832}
            fillOpacity={0.5}
            fill="#FFF"
            fillRule="nonzero"
            x={43.416}
            y={20.416}
            width={64.168}
            height={22.168}
            rx={2.5}
          />
          <Path
            d="M97.635 31.784l2.795-2.795a.258.258 0 0 0 0-.365l-.486-.486a.258.258 0 0 0-.365 0l-2.795 2.795-2.795-2.795a.258.258 0 0 0-.365 0l-.486.486a.258.258 0 0 0 0 .365l2.795 2.795-2.795 2.795a.258.258 0 0 0 0 .365l.486.486a.258.258 0 0 0 .365 0l2.795-2.795 2.795 2.795a.258.258 0 0 0 .365 0l.486-.486a.258.258 0 0 0 0-.365l-2.795-2.795z"
            fill="#EA2E49"
            fillRule="nonzero"
          />
          <Path
            d="M256 32c-8.837 0-16-7.163-16-16s7.163-16 16-16 16 7.163 16 16-7.163 16-16 16z"
            fill="#FFF"
            fillRule="nonzero"
          />
          <Path
            d="M256 30c-7.732 0-14-6.268-14-14s6.268-14 14-14 14 6.268 14 14-6.268 14-14 14z"
            stroke="#FFF"
            strokeWidth={4}
            fill="#EA2E49"
          />
          <Path
            d="M257.238 16.31l3.05-3.05a.282.282 0 0 0 0-.398l-.53-.53a.282.282 0 0 0-.399 0l-3.049 3.05-3.05-3.05a.282.282 0 0 0-.398 0l-.53.53a.282.282 0 0 0 0 .399l3.05 3.049-3.05 3.05a.282.282 0 0 0 0 .398l.53.53c.11.11.289.11.399 0l3.049-3.05 3.05 3.05c.11.11.287.11.398 0l.53-.53a.282.282 0 0 0 0-.399l-3.05-3.049z"
            id="a"
            fill="#FFF"
            fillRule="nonzero"
          />
        </G>
      </Svg>
    );
  }
}
