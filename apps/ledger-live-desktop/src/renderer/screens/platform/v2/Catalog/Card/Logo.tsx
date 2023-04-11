import React, { useState, useCallback, useMemo } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import styled from "styled-components";

export function Logo({
  icon,
  name,
  size,
}: Pick<LiveAppManifest, "icon" | "name"> & { size: Size; disabled: boolean }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const onLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const { logoSize, borderRadius } = useMemo(() => {
    switch (size) {
      case "small":
        return { logoSize: 32, borderRadius: 4 };
      case "medium":
      default:
        return { logoSize: 40, borderRadius: 8 };
    }
  }, [size]);

  return (
    <Flex
      borderRadius={borderRadius}
      width={logoSize}
      height={logoSize}
      marginRight={2}
      overflow="hidden"
      alignItems="center"
      justifyContent="center"
      backgroundColor={isLoaded ? "transparent" : "neutral.c50"}
    >
      {!isLoaded && <Text>{name[0].toUpperCase()}</Text>}

      {icon && <Image src={icon} onLoad={onLoad} isLoaded={isLoaded} />}
    </Flex>
  );
}

const Image = styled.img.attrs({
  width: "100%",
  height: "100%",
})<{ isLoaded: boolean }>`
  display: ${p => (p.isLoaded ? "default" : "none")};
`;

type Size = "medium" | "small";
