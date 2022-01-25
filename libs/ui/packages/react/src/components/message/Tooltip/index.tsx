import React, { forwardRef } from "react";
import { isForwardRef } from "react-is";
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

// Tippyjs need the ref to be forwarded to the DOM element wrapping the children.
// This component has been created to add a wrapping span and use its ref when needed.
// See: https://github.com/atomiks/tippyjs-react#component-children
const Wrapper: React.ComponentType<React.PropsWithChildren<unknown>> = forwardRef(
  (props, ref: React.LegacyRef<HTMLElement>) => {
    const childrenCount = React.Children.count(props.children);

    try {
      const child = React.Children.only(props.children);
      const isValidElement = React.isValidElement(child);
      const isForwardingRef = isForwardRef(child);
      const isDomElement = isValidElement && typeof child.type === "string";

      if (isForwardingRef || isDomElement) {
        return React.cloneElement(child, { ref });
      } else {
        return <span ref={ref}>{props.children}</span>;
      }
    } catch (e) {
      return childrenCount < 1 ? null : <span ref={ref}>{props.children}</span>;
    }
  },
);

export default function Tooltip(props: Props): JSX.Element | null {
  const { content, placement = "auto", children, ...rest } = props;
  return (
    <Tippy
      {...rest}
      placement={placement}
      content={
        <Text fontWeight="medium" variant={"paragraph"} color="neutral.c00">
          {content}
        </Text>
      }
    >
      <Wrapper children={children} />
    </Tippy>
  );
}
