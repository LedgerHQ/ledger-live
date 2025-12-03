import { Flex } from "@ledgerhq/react-ui/index";
import React, { useRef, useState, useLayoutEffect, PropsWithChildren } from "react";
import { useSpring, animated } from "react-spring";
import useTheme from "~/renderer/hooks/useTheme";

const closedHeight = (hasSubtitle: boolean) => (hasSubtitle ? 79 : 54);

interface AnimatedWrapperProps extends PropsWithChildren {
  isCollapsed: boolean;
  hasSubtitle: boolean;
}

const AnimatedWrapper = ({ children, isCollapsed, hasSubtitle }: AnimatedWrapperProps) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [prevHeight, setPrevHeight] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const theme = useTheme();

  // Measure content height when open/close or children change
  useLayoutEffect(() => {
    if (contentRef.current) {
      const newHeight = contentRef.current.scrollHeight;

      setPrevHeight(targetHeight); // Save previous height before updating
      setTargetHeight(newHeight);
    }
  }, [children, targetHeight]);

  const springStyles = useSpring({
    from: { height: prevHeight },
    to: { height: isCollapsed ? closedHeight(hasSubtitle) : targetHeight },
    config: { duration: 300 },
  });

  return (
    <animated.div
      style={{
        ...springStyles,
        position: "relative",
        borderRadius: "12px",
        overflow: "hidden",
        flexDirection: "column",
        backgroundColor: theme.colors.palette.neutral.c20,
        border: `1px solid ${theme.colors.opacityDefault.c05}`,
      }}
    >
      <Flex
        ref={contentRef}
        style={{
          padding: "16px",
          gap: "16px",
        }}
        flexDirection="column"
      >
        {children}
      </Flex>
    </animated.div>
  );
};

export default AnimatedWrapper;
