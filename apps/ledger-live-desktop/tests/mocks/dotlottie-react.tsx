import React from "react";

/**
 * Mock for @lottiefiles/dotlottie-react (ESM-only) so Jest can run without transforming node_modules.
 * LoadingOverlay uses: <DotLottieReact src={...} loop autoplay style={...} />
 */
export function DotLottieReact({
  style,
  ...props
}: {
  src?: string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  [key: string]: unknown;
}) {
  return <div data-testid="dotlottie-mock" style={style} {...props} />;
}

export function DotLottieWorkerReact(props: React.ComponentPropsWithoutRef<"div">) {
  return <div data-testid="dotlottie-worker-mock" {...props} />;
}

export function setWasmUrl(_url: string) {
  // no-op in tests
}
