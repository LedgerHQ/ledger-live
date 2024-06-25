import React, { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";

export function JsonEditor({
  value,
  onChange,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const extensions = useMemo(() => [json()], []);

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      height="300px"
      extensions={extensions}
    />
  );
}
