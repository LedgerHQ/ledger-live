import React from "react";

import { stacksMemoPatch } from "@ledgerhq/live-common/bridge/descriptor/send/memo";
import { STACKS_MAX_MEMO_SIZE } from "@ledgerhq/live-common/families/stacks/constants";
import type { Transaction as StacksTransaction } from "@ledgerhq/live-common/families/stacks/types";
import type { MemoTagInputProps } from "LLM/features/MemoTag/types";
import { GenericMemoTagInput } from "LLM/features/MemoTag/components/GenericMemoTagInput";
import { truncateUtf8 } from "LLM/utils/truncateUtf8";

// `TextInputProps.maxLength` can not be used here because it counts the length of the string instead of the byte size.
// E.g.
// Javascript will evaluate a 16👍 emojis string as 34 characters.
//  While this string is in fact encoded in 68B in UTF8 which is well above STX limit.
// `truncateUtf8` will truncate the string correctly, which is 8👍 with 2 characters to spare.

export default (props: MemoTagInputProps<StacksTransaction>) => (
  <GenericMemoTagInput
    {...props}
    textToValue={text => truncateUtf8(text, STACKS_MAX_MEMO_SIZE)}
    valueToTxPatch={value => tx => ({ ...tx, ...stacksMemoPatch(value) })}
  />
);
