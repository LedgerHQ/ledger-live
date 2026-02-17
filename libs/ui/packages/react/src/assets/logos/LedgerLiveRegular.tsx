import * as React from "react";

type Props = { width?: number | string; height?: number | string; color?: string };

function LedgerLiveRegular({
  width = 220,
  height = 60,
  color = "currentColor",
}: Props): React.JSX.Element {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 42.9632V60H25.9539V56.2217H3.78153V42.9632H0ZM65.2185 42.9632V56.2217H43.0461V59.9991H69V42.9632H65.2185ZM25.9915 17.0368V42.9623H43.0461V39.5551H29.7731V17.0368H25.9915ZM0 0V17.0368H3.78153V3.7774H25.9539V0H0ZM43.0461 0V3.7774H65.2185V17.0368H69V0H43.0461Z"
        fill={color}
      />
      <path
        d="M86.7939 17.75H90.5814L92.1189 39.725H92.6439L94.4814 22.2125H100.144L102.019 39.725H102.544L104.156 17.75H107.794L105.356 44H99.5439L97.5564 26.4875H97.0314L95.0439 44H89.2314L86.7939 17.75Z"
        fill={color}
      />
      <path
        d="M129.904 44H125.892L124.204 37.625H115.317L113.554 44H109.654L117.229 17.75H122.554L129.904 44ZM116.254 34.175H123.304L120.117 22.025H119.592L116.254 34.175Z"
        fill={color}
      />
      <path d="M134.577 17.75H138.402V40.55H151.827V44H134.577V17.75Z" fill={color} />
      <path d="M157.062 17.75H160.887V40.55H174.312V44H157.062V17.75Z" fill={color} />
      <path
        d="M179.173 17.75H195.673V21.2H182.998V29.075H194.548V32.525H182.998V40.55H196.235V44H179.173V17.75Z"
        fill={color}
      />
      <path d="M207.808 21.2H199.596V17.75H219.846V21.2H211.633V44H207.808V21.2Z" fill={color} />
    </svg>
  );
}

export default LedgerLiveRegular;
