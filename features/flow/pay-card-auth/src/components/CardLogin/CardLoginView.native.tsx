import React from "react";
import {
  Box,
  Button,
  Subheader,
  SubheaderDescription,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { NetworkWarning } from "@ledgerhq/lumen-ui-rnative/symbols";
import { CardAuthError } from "./CardAuthError";
import { CardLoginIntroView } from "./CardLoginIntroView";
import type { CardLoginViewProps } from "./types";

type CardLoginNativeViewProps = Omit<
  CardLoginViewProps,
  "alreadyHaveCardLabel" | "onAlreadyHaveCardPress"
>;

export function CardLoginView({
  title,
  description,
  loginLabel,
  isLoading,
  error,
  onLoginPress,
  intro,
}: CardLoginNativeViewProps) {
  if (error) {
    return <CardAuthError icon={NetworkWarning} {...error} />;
  }

  return (
    <>
      <Box
        lx={{
          flexDirection: "column",
          gap: "s4",
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
      </Box>
      <CardLoginIntroView {...intro} />
    </>
  );
}
