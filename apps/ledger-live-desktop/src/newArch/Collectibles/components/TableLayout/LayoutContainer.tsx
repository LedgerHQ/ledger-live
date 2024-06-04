import React, { memo, ReactNode } from "react";
import styled from "styled-components";
import Box from "~/renderer/components/Box";
import useLayout from "LLD/Collectibles/hooks/useLayout";
import { Layout, LayoutKey } from "LLD/Collectibles/types/Layouts";

const Container = styled(Box).attrs<{
  mode?: Layout;
}>({})<{ mode: LayoutKey }>`
  display: ${p => (p.mode === "list" ? "flex" : "grid")};
  grid-gap: ${p => (p.mode === "list" ? 10 : 18)}px;
  grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
  margin-bottom: 20px;
`;

type LayoutContainerProps = {
  children: ReactNode;
};

const LayoutContainerComponent: React.FC<LayoutContainerProps> = ({
  children,
}: LayoutContainerProps) => {
  const { collectiblesViewMode } = useLayout();
  return <Container mode={collectiblesViewMode}>{children}</Container>;
};

export const LayoutContainer = memo(LayoutContainerComponent);
