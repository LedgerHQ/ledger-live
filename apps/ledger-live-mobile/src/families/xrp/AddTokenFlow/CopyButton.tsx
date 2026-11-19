import React, { useEffect, useRef, useState } from "react";
import { InteractiveIcon } from "@ledgerhq/lumen-ui-rnative";
import { Check, Copy } from "@ledgerhq/lumen-ui-rnative/symbols";
import { copyToClipboard } from "@shared/clipboard";

const COPIED_FEEDBACK_MS = 3000;

type Props = Readonly<{ value: string; label: string; testID: string }>;

export function CopyButton({ value, label, testID }: Props) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const onPress = async () => {
    const didCopy = await copyToClipboard(value);
    if (!didCopy) return;

    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  };

  return (
    <InteractiveIcon
      icon={copied ? Check : Copy}
      size={16}
      iconType="stroked"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
    />
  );
}
