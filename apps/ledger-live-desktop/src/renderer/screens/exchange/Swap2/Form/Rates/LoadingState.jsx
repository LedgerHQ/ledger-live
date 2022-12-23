// @flow
import React from "react";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { Trans } from "react-i18next";

function Loader() {
  const [dots, setDots] = React.useState("");

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(dots => (dots.length < 3 ? dots + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <Text style={{ position: "absolute" }}>{dots}</Text>;
}

// TODO: translations need adding
function LoadingState() {
  return (
    <Box alignItems={"center"}>
      <Text
        ff="Inter|Medium"
        color="palette.text.shade100"
        style={{
          justifyContent: "flex-end",
          textAlign: "center",
          marginTop: "24px",
          marginBottom: "0.5rem",
        }}
        fontSize={5}
      >
        Loading quotes
        <Loader />
      </Text>
      <Text
        ff="Inter|Medium"
        color="palette.text.shade50"
        style={{
          justifyContent: "flex-end",
          textAlign: "center",
        }}
        fontSize={4}
      >
        It will take only a moment to find the best quotes available.
      </Text>
    </Box>
  );
}

export default React.memo<Props>(LoadingState);
