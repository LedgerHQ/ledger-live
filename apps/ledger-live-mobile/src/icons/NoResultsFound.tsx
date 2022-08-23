import React from "react";

import Illustration from "../images/illustration/Illustration";

const dark = require("../images/illustration/Dark/_051.png");
const light = require("../images/illustration/Light/_051.png");

export default function NoResultsFound(props: any) {
  return (
    <Illustration darkSource={dark} lightSource={light} size={140} {...props} />
  );
}
