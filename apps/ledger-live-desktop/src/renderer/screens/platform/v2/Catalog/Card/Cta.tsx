import React from "react";
import { Box, Button } from "@ledgerhq/react-ui";
import { PropsCta } from "./types";

export function Cta({ text }: PropsCta) {
  return (
    <Box
      flex={1}
      ml={0}
      mt={0}
      minWidth={100}
      flexWrap={"wrap"}
      alignItems={"center"}
      display={{ _: "none", md: "flex" }}
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
        }}
      >
        {text}
      </Button>
    </Box>
  );
}
