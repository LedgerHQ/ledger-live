import React from "react";
import { RequestReceiveView } from "./RequestReceiveView";
import { useRequestReceiveViewModel } from "./useRequestReceiveViewModel";
import type { RequestReceiveProps } from "../../types";

export function RequestReceive(props: RequestReceiveProps) {
  const vm = useRequestReceiveViewModel(props);

  return <RequestReceiveView {...props} {...vm} />;
}
