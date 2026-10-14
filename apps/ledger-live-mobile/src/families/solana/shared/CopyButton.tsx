import React, { useEffect } from "react";
import { Box, Link } from "@ledgerhq/native-ui";
import { CopyMedium } from "@ledgerhq/native-ui/assets/icons";
import { copyToClipboard } from "@shared/clipboard";

type Props = {
  copyString: string;
};

export default function CopyButton({ copyString }: Props) {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const onPress = async () => {
    if (copied) return;
    if (!(await copyToClipboard(copyString))) return;
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
