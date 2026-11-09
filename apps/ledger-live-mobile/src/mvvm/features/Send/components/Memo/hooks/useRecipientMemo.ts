import {
  useRecipientMemoCore,
  type UseRecipientMemoCoreParams,
} from "@features/platform-send-flow";
import { useDoNotAskAgainSkipMemo } from "../../../hooks/useDoNotAskAgainSkipMemo";

export type UseRecipientMemoProps = Omit<
  UseRecipientMemoCoreParams,
  "doNotAskAgainSkipMemo" | "setDoNotAskAgainSkipMemo"
>;

export function useRecipientMemo(props: UseRecipientMemoProps) {
  const [doNotAskAgainSkipMemo, setDoNotAskAgainSkipMemo] = useDoNotAskAgainSkipMemo();
  return useRecipientMemoCore({ ...props, doNotAskAgainSkipMemo, setDoNotAskAgainSkipMemo });
}
