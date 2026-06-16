import {
  useRecipientMemoCore,
  type UseRecipientMemoCoreParams,
} from "@ledgerhq/live-common/flows/send/recipient/hooks/useRecipientMemoCore";
import { useDoNotAskAgainSkipMemo } from "./useDoNotSkipAgainMemo";

export type UseRecipientMemoProps = Omit<
  UseRecipientMemoCoreParams,
  "doNotAskAgainSkipMemo" | "setDoNotAskAgainSkipMemo"
>;

export function useRecipientMemo(props: UseRecipientMemoProps) {
  const [doNotAskAgainSkipMemo, setDoNotAskAgainSkipMemo] = useDoNotAskAgainSkipMemo();
  return useRecipientMemoCore({ ...props, doNotAskAgainSkipMemo, setDoNotAskAgainSkipMemo });
}
