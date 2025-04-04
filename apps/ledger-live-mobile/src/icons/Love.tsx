/* eslint-disable @typescript-eslint/no-var-requires */
import React from "react";

import Illustration from "~/images/illustration/Illustration";

const dark = require("~/images/illustration/Dark/_081.webp");
const light = require("~/images/illustration/Light/_081.webp");

export default function Love(
  props: Omit<React.ComponentProps<typeof Illustration>, "darkSource" | "lightSource">,
) {
  return <Illustration darkSource={dark} lightSource={light} size={140} {...props} />;
}
