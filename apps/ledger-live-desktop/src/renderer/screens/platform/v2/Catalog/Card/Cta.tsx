import React from "react";
import { Box, Button } from "@ledgerhq/react-ui";
import { PropsCta } from "./types";
import Ellipsis from "~/renderer/components/Ellipsis";

export function Cta({ text }: PropsCta) {
  return (
    <Box
      flex={1}
      ml={0}
      mt={0}
      minWidth={100}
      alignItems={"center"}
      display={{ _: "none", md: "flex" }}
      justifyContent={"flex-end"}
    >
      <Button
        style={{
          height: 32,
          borderRadius: 72,
          boxShadow: "none",
          borderWidth: 0,
          background: "linear-gradient(97deg, #8675F1 0.29%, #4531C0 100.29%)",
          color: "white",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        <Ellipsis>{text}</Ellipsis>
      </Button>
    </Box>
  );
}
