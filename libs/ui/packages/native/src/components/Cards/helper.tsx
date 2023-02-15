import React from "react";
import { Text } from "../../index";
import { BaseTextProps } from "../Text";

function highlight(text: string, variant: BaseTextProps["variant"]) {
  const textSplitted = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .split(/<bold>(.*?)<\/bold>/g);

  const elems: (string | JSX.Element)[] = [];

  textSplitted.forEach((w, index) => {
    if (index % 2 !== 0) {
      const word = w.replace(/<bold>(.*?)<\/bold>/g, "$1");
      elems.push(
        <Text
          key={"highlighted_" + index}
          variant={variant}
          fontWeight="semiBold"
          color="primary.c80"
        >
          {word}
        </Text>,
      );
    } else {
      elems.push(w);
    }
  });
  return elems;
}

export { highlight };
