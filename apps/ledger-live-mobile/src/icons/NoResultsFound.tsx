/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import Illustration from "~/images/illustration/Illustration";

const dark = require("~/images/illustration/Dark/_051.webp");
const light = require("~/images/illustration/Light/_051.webp");

export default function NoResultsFound(
  props: Omit<React.ComponentProps<typeof Illustration>, "darkSource" | "lightSource">,
) {
  return <Illustration darkSource={dark} lightSource={light} size={140} {...props} />;
}
