import React from "react";
import { ListView } from "./ListView";
import type { ListProps } from "./types";

export function List(props: ListProps) {
  return <ListView {...props} />;
}
