import React from "react";

import Illustration from "../images/illustration/Illustration";

const dark = require("../images/illustration/Dark/_081.png");
const light = require("../images/illustration/Light/_081.png");

export default function Love(props: any) {
  return (
    <Illustration darkSource={dark} lightSource={light} size={140} {...props} />
  );
}
