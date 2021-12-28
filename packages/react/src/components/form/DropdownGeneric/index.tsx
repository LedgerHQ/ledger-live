import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFloating, shift } from "@floating-ui/react-dom";
import styled from "styled-components";
import { Icons } from "../../../";
import Flex from "../../layout/Flex";
import Box from "../../layout/Flex";
import Text from "../../asorted/Text";

const ButtonContainer = styled(Box).attrs({
  flexDirection: "row",
  width: "auto",
  alignItems: "center",
  height: "36px",
})<{ disabled?: boolean; opened: boolean }>`
  cursor: ${(p) => !p.disabled && "pointer"};
  > :last-child {
    /* targeting the dropdown icon */
    ${(p) => p.opened && "transform: rotate(180deg);"}
    margin: 0px ${(p) => p.theme.space[3]}px;
  }
`;

const DropdownContainer = styled(Flex).attrs(({ theme }) => {
  const isLight = theme.colors.type === "light";
  return {
    display: "flex",
    flexDirection: "column",
    padding: 3,
    border: `1px solid ${theme.colors.neutral[isLight ? "c20" : "c30"]}`,
    borderRadius: "8px",
    backgroundColor: isLight ? "neutral.c00" : "neutral.c20",
    color: theme.colors.neutral.c80,
  };
})`
  box-shadow: 0px 6px 12px rgba(0, 0, 0, ${(p) => (p.theme.colors.type === "light" ? 0.04 : 0.08)});
`;

export type Props = {
  /**
   * Label of the dropdown button, displayed before the dropdown icon.
   */
  label: string | React.ReactNode;
  /**
   * Controls whether the dropdown can be open.
   * Defaults to false.
   */
  disabled?: boolean;
  /**
   * Controls whether the dropdown will close on a click event happening outside of this component.
   * Defaults to true.
   */
  closeOnClickOutside?: boolean;
  /**
   * Controls whether the dropdown will close on a click event happening inside the dropdown.
   * Defaults to false.
   */
  closeOnClickInside?: boolean;
  /**
   * Content of the dropdown.
   */
  children: React.ReactNode;
  /**
   * Horizontal position of the dropdown relative to the dropdown button.
   * Will automatically adjust to the document to avoid overflowing.
   * Defaults to "bottom".
   */
  placement?: "bottom-start" | "bottom" | "bottom-end";
};

const DropdownGeneric = ({
  label,
  closeOnClickOutside = true,
  closeOnClickInside = false,
  disabled = false,
  placement = "bottom",
  children,
}: Props) => {
  const divRef = useRef<HTMLDivElement>(null);

  const [opened, setOpened] = useState(false);

  const handleClickButton = useCallback(() => {
    if (!disabled) setOpened(!opened);
  }, [opened, disabled]);

  const { x, y, reference, floating, strategy } = useFloating({
    placement,
    middleware: [shift()],
  });

  const handleClickInside = useCallback(() => {
    if (closeOnClickInside) setOpened(false);
  }, [setOpened, closeOnClickInside]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        closeOnClickOutside &&
        opened &&
        divRef.current &&
        !divRef.current.contains(event.target as Node)
      ) {
        setOpened(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [closeOnClickOutside, opened, setOpened, divRef]);

  const color = disabled ? "neutral.c50" : "neutral.c100";

  return (
    <div ref={divRef}>
      <ButtonContainer
        ref={reference}
        onClick={handleClickButton}
        disabled={disabled}
        opened={opened && !disabled}
      >
        <Text variant="paragraph" fontWeight="medium" color={color}>
          {label}
        </Text>
        <Icons.DropdownMedium size={20} color={color} />
      </ButtonContainer>
      {opened && !disabled && (
        <DropdownContainer
          onClick={handleClickInside}
          ref={floating}
          style={{ overflow: "visible", position: strategy, top: y ?? "", left: x ?? "" }}
        >
          {children}
        </DropdownContainer>
      )}
    </div>
  );
};

export default DropdownGeneric;
