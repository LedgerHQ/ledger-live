import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFloating, getScrollParents, shift, size, flip } from "@floating-ui/react-dom";
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
  cursor: ${p => !p.disabled && "pointer"};
  > :last-child {
    /* targeting the dropdown icon */
    ${p => p.opened && "transform: rotate(180deg);"}
    margin-left: ${p => p.theme.space[3]}px;
  }
`;

const DropdownContainer = styled(Flex).attrs(({ theme }) => {
  const isLight = theme.colors.type === "light";
  return {
    zIndex: 1,
    flexDirection: "column",
    padding: 3,
    border: `1px solid ${theme.colors.neutral[isLight ? "c20" : "c30"]}`,
    borderRadius: "8px",
    backgroundColor: isLight ? "neutral.c00" : "neutral.c20",
    color: theme.colors.neutral.c80,
  };
})`
  overflow-y: auto;
  box-shadow: 0px 6px 12px rgba(0, 0, 0, ${p => (p.theme.colors.type === "light" ? 0.04 : 0.08)});
`;

export const placements = ["bottom-start", "bottom", "bottom-end"] as const;
type Placement = (typeof placements)[number];

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
   * Vertical alignment of the dropdown relative to the dropdown button.
   * Will automatically adjust to the document to avoid overflowing.
   * Defaults to "bottom".
   */
  placement?: Placement;
  /**
   * Controls whether the dropdown will flip its side to keep it in view
   * in case there isn't enough space available. See https://floating-ui.com/docs/flip
   * Defaults to false.
   */
  flipDisabled?: boolean;
};

const DropdownGeneric = ({
  label,
  closeOnClickOutside = true,
  closeOnClickInside = false,
  disabled = false,
  placement = "bottom",
  flipDisabled = false,
  children,
}: Props) => {
  const divRef = useRef<HTMLDivElement>(null);

  const [maxHeight, setMaxHeight] = useState<number>();
  const [maxWidth, setMaxWidth] = useState<number>();

  const [opened, setOpened] = useState(false);

  const handleClickButton = useCallback(() => {
    if (!disabled) setOpened(!opened);
  }, [opened, disabled]);

  const handleClickInside = useCallback(() => {
    if (closeOnClickInside) setOpened(false);
  }, [setOpened, closeOnClickInside]);

  const { x, y, reference, floating, strategy, update, refs } = useFloating({
    placement: placements.includes(placement) ? placement : "bottom",
    middleware: [
      shift(),
      ...(flipDisabled ? [] : [flip()]),
      size({
        padding: 6,
        apply({ height, width }: { height: number; width: number }) {
          setMaxHeight(height);
          setMaxWidth(width);
        },
      }),
    ],
  });

  const handleResizeOrScroll = useCallback(() => {
    if (opened && !disabled) update();
  }, [opened, disabled, update]);

  useEffect(() => {
    if (!refs.reference.current || !refs.floating.current) {
      return;
    }
    const parents = [
      ...getScrollParents(refs.reference.current),
      ...getScrollParents(refs.floating.current),
    ];
    parents.forEach(parent => {
      parent.addEventListener("scroll", handleResizeOrScroll);
      parent.addEventListener("resize", handleResizeOrScroll);
    });
    return () => {
      parents.forEach(parent => {
        parent.removeEventListener("scroll", handleResizeOrScroll);
        parent.removeEventListener("resize", handleResizeOrScroll);
      });
    };
  }, [flipDisabled, refs.reference, refs.floating, handleResizeOrScroll]);

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
    <Box ref={divRef}>
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
          ref={floating}
          style={{
            position: strategy,
            top: y ?? "",
            left: x ?? "",
            maxHeight: maxHeight ? `${maxHeight}px` : "",
            maxWidth: maxWidth ? "" : "",
            // maxWidth: maxWidth ? `${maxWidth}px` : "", /* TODO: fix this */
          }}
          onClick={handleClickInside}
        >
          {children}
        </DropdownContainer>
      )}
    </Box>
  );
};

export default DropdownGeneric;
