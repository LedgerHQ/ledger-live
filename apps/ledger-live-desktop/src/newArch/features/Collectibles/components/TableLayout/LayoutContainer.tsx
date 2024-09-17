import React, { memo, ReactNode } from "react";
import Box from "~/renderer/components/Box";

type LayoutContainerProps = {
  children: ReactNode;
};

const LayoutContainerComponent: React.FC<LayoutContainerProps> = ({
  children,
}: LayoutContainerProps) => {
  return (
    <Box width={"100%"} justifyContent={"flex-end"} mb={20}>
      {children}
    </Box>
  );
};

export const LayoutContainer = memo(LayoutContainerComponent);
