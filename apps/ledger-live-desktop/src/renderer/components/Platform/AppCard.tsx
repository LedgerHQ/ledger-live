import React, { useCallback } from "react";
import styled, { css } from "styled-components";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import { rgba } from "~/renderer/styles/helpers";
import { Tabbable } from "~/renderer/components/Box";
import { AppDetails, IconContainer } from "./AppDetails";
export { AppDetails } from "./AppDetails";

const Container = styled(Tabbable).attrs<{
  isActive?: boolean;
  disabled?: boolean;
}>({
  flex: 1,
  flexDirection: "column",
  alignItems: "center",
  fontSize: 4,
})<{ id?: string }>`
  min-height: 180px;
  padding: 24px;
  border-radius: 4px;
  cursor: ${p => (p.disabled ? "default" : "pointer")};
  background: ${p => p.theme.colors.neutral.c30};
  color: ${p => p.theme.colors.neutral.c100};
  border: 1px solid ${p => p.theme.colors.neutral.c40};

  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.04);

  ${p =>
    p.disabled
      ? css`
          background: ${p.theme.colors.neutral.c30};
          opacity: 0.5;

          ${IconContainer} {
            filter: grayscale(100%);
          }
        `
      : css`
          &:hover,
          &:focus {
            ${p => css`
              box-shadow: 0px 0px 0px 4px ${rgba(p.theme.colors.primary.c70, 0.25)};
              border: ${p => `1px solid ${p.theme.colors.primary.c70}`};
            `}
          }
        `}
`;

type Props = {
  manifest: LiveAppManifest;
  onClick: Function;
  id?: string;
};

export function AppCard({ manifest, onClick, id }: Props) {
  const isDisabled = manifest.branch === "soon";
  const handleClick = useCallback(() => {
    if (!isDisabled) {
      onClick();
    }
  }, [onClick, isDisabled]);

  return (
    <Container id={id} onClick={handleClick} disabled={isDisabled}>
      <AppDetails manifest={manifest} />
    </Container>
  );
}
