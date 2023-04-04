import React, { useEffect, useState } from "react";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { useTranslation } from "react-i18next";
function Loader() {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(dots => (dots.length < 3 ? dots + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);
  return (
    <Text
      style={{
        position: "absolute",
      }}
    >
      {dots}
    </Text>
  );
}
function LoadingState() {
  const { t } = useTranslation();
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
        {t("swap2.form.rates.loadingQuotes")}
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
        {t("swap2.form.rates.loadingDescription")}
      </Text>
    </Box>
  );
}
export default LoadingState;
