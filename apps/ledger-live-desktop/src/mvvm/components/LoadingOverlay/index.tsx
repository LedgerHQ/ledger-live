import React from "react";
import { getEnv } from "@ledgerhq/live-env";
import { Box } from "@ledgerhq/react-ui";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import loaderLottie from "~/renderer/animations/common/loader.lottie";

export const LoadingOverlay = ({ theme }: { theme: "light" | "dark" }) => {
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");
  const backgroundColor = theme === "light" ? "rgba(255, 255, 255, 1)" : "rgba(28, 29, 31, 1)";

  return (
    <Box position="absolute" zIndex={-10} height="100%" width="100%" left={0} bottom={0}>
      <Box
        position="absolute"
        zIndex={1}
        height="100%"
        width="100%"
        style={{
          backgroundImage: `linear-gradient(180deg, ${backgroundColor}, 80%, rgba(0,0,0,0))`,
        }}
      />

      <DotLottieReact
        src={loaderLottie}
        loop
        autoplay={!isPlaywright}
        layout={{ fit: "cover", align: [1, 1] }}
        style={{ width: "100%", height: "100%" }}
      />
    </Box>
  );
};
