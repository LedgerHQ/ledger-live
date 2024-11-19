import React from "react";
import { Flex, CryptoIcon } from "@ledgerhq/react-ui";

const DiscoveryDrawerHeader: React.FC = () => (
  <Flex
    borderRadius="100%"
    justifyContent="center"
    backgroundColor={"#F7931A"}
    padding={80}
    style={{
      height: 400,
      width: 400,
      position: "absolute",
      top: 0,
      left: "50%",
      transform: "translateX(-50%) translateY(-50%)",
      filter: "blur(17px)",
      opacity: 0.2,
    }}
  >
    <CryptoIcon name="BTC" circleIcon size={300} />
  </Flex>
);

export default DiscoveryDrawerHeader;
