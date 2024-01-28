import React, { FC } from "react";
import { SubProps, Variant } from "../types";
import FooterContentCard from "./variant-contentCard";
import FooterDefault from "./variant-default";

const Footers: { [key in Variant]: FC<SubProps> } = {
  "content-card": FooterContentCard,
  default: FooterDefault,
};

const Footer = (props: SubProps) => {
  const Component = Footers[props.variant];
  return <Component {...props} />;
};

export default Footer;
