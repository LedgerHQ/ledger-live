import React, { useRef } from "react";
import Tippy, { TippyProps } from "@tippyjs/react";
import Text from "../../asorted/Text";

type Placement =
  | "top"
  | "top-start"
  | "top-end"
  | "right"
  | "right-start"
  | "right-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "auto"
  | "auto-start"
  | "auto-end";

// Add more props later on if needed.
// See https://atomiks.github.io/tippyjs/v6/all-props for the full list.
export interface Props extends TippyProps {
  /** The preferred placement of the tippy. */
  placement?: Placement;
}

export default function Tooltip(props: Readonly<Props>): React.JSX.Element | null {
  const { content, placement = "auto", children, ...rest } = props;
  const triggerRef = useRef<HTMLSpanElement>(null);
  return (
    <>
      <span ref={triggerRef} style={{ display: "inline-flex" }}>
        {children}
      </span>
      <Tippy
        {...rest}
        reference={triggerRef as React.RefObject<Element>}
        placement={placement}
        content={
          <Text fontWeight="medium" variant={"paragraph"} color="neutral.c00">
            {content}
          </Text>
        }
      />
    </>
  );
}
