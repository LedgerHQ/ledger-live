import React from "react";
import { PropsBody, PropsBodyElem } from "./types";
import { Flex } from "@ledgerhq/react-ui";

const LIMIT = 5;

export function WidgetList({ data }: PropsBody) {
  return (
    <Flex flexDirection={"column"}>
      {data.slice(0, LIMIT).map((elem, i) => (
        <WidgetRow key={i} data={elem} />
      ))}
    </Flex>
  );
}

function WidgetRow({ data }: PropsBodyElem) {
  return <Flex>{data.currency.name}</Flex>;
}
