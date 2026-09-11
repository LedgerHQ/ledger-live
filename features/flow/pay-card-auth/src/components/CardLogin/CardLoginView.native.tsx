import React from "react";
import {
  Box,
  Button,
  Subheader,
  SubheaderDescription,
  SubheaderRow,
  SubheaderTitle,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

export function CardLoginView({
  title,
  description,
  loginLabel,
  isLoading,
  errorMessage,
  onLoginPress,
  intro,
}: CardLoginViewProps) {
  return (
    <>
      <Box
        lx={{
          flexDirection: "column",
          gap: "s4",
          paddingTop: "s16",
        }}
      >
        <Box lx={{ flexDirection: "row", alignItems: "center", gap: "s16" }}>
          <Subheader lx={{ flex: 1 }} style={{ minWidth: 0 }}>
            <SubheaderRow>
              <SubheaderTitle>{title}</SubheaderTitle>
            </SubheaderRow>
            <SubheaderDescription>{description}</SubheaderDescription>
          </Subheader>
          <Button
            appearance="base"
            size="md"
            loading={isLoading}
            disabled={isLoading}
            onPress={onLoginPress}
            accessibilityLabel={loginLabel}
          >
            {loginLabel}
          </Button>
        </Box>
        {errorMessage ? (
          <Text typography="body3" lx={{ color: "error", alignSelf: "flex-end" }}>
            {errorMessage}
          </Text>
        ) : null}
      </Box>
      <CardLoginIntroView {...intro} />
    </>
  );
}
