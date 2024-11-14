import React from "react";
import styled from "styled-components";
import { Icons } from "../../../assets";

type Props = ContainerProps & {
  onClick: () => void;
};

export function ChevronArrow(props: Props) {
  return (
    <ChevronArrowContainer {...props}>
      <Icons.ChevronLeft />
    </ChevronArrowContainer>
  );
}

type ContainerProps = {
  direction: "left" | "right";
};

const ChevronArrowContainer = styled.button<ContainerProps>`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;

  position: absolute;
  top: 50%;
  left: ${({ direction }) => (direction === "left" ? "0" : "auto")};
  right: ${({ direction }) => (direction === "left" ? "auto" : "0")};
  z-index: 1;

  --dir: ${({ direction }) => (direction === "left" ? "1" : "-1")};
  scale: var(--dir) 1;
  translate: calc(-50% * var(--dir)) -50%;

  background-color: ${({ theme }) => theme.colors.background.default}; // Fake the transparent clip
  border-radius: 100%;
  border: none;
  outline: none;

  ::before {
    content: "";
    display: block;
    position: absolute;
    z-index: -1;
    inset: 3px;
    background-color: ${({ theme }) => theme.colors.opacityDefault.c05};
    border-color: ${({ theme }) => theme.colors.opacityDefault.c05};
    border-radius: 100%;
    border-style: solid;
    border-width: 1px;
  }
  svg {
    color: ${({ theme }) => theme.colors.primary.c100};
  }
  ::before,
  svg {
    cursor: pointer;
  }

  transition: opacity 0.2s ease-in-out;
  opacity: var(--hover-transition);
  ::before,
  svg {
    transition: translate 0.2s ease-in-out;
    translate: calc(-50% + 50% * var(--hover-transition)) 0;
  }
`;
