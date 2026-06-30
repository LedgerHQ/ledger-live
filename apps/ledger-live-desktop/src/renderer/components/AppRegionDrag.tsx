import React from "react";
import { useLocation } from "react-router";
import styled from "styled-components";
const DEFAULT_DRAG_HEIGHT = 40;

/** Matches Recover header top padding. */
const RECOVER_DRAG_HEIGHT = 32;

const DragStrip = styled.div<{ $height: number }>`
  -webkit-app-region: drag;
  height: ${p => p.$height}px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`;

export default function AppRegionDrag() {
  const { pathname } = useLocation();
  const height = pathname.includes("recover") ? RECOVER_DRAG_HEIGHT : DEFAULT_DRAG_HEIGHT;

  return <DragStrip $height={height} />;
}
