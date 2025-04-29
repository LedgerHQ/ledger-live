import React, { useEffect } from "react";
import { Box, Link } from "@ledgerhq/native-ui";
import { CopyMedium } from "@ledgerhq/native-ui/assets/icons";
import Clipboard from "@react-native-clipboard/clipboard";

type Props = {
  copyString: string;
};

export default function CopyButton({ copyString }: Props) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  const onPress = () => {
    if (copied) return;
    Clipboard.setString(copyString);
    setCopied(true);
    timerRef.current = setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <Box width={30} mt={-1}>
      <Link type={"color"} Icon={CopyMedium} iconPosition="left" onPress={onPress} />
    </Box>
  );
}
