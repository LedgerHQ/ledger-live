import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type ace from "brace";

export function JsonEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const initialValueRef = useRef(value);
  const editorRef = useRef<ace.Editor | null>(null);

  // on value changes and it's diff from editor, we force it
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (editorRef.current && editorRef.current.getValue() !== value) {
        console.log("FORCE", value);
        editorRef.current.setValue(value);
      }
    }, 100);
    return () => {
      clearTimeout(timeout);
    };
  }, [value]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ace = require("brace");
    require("brace/mode/json");
    require("brace/theme/github");
    const editor = ace.edit("editor");
    editor.setTheme("ace/theme/github");
    editor.getSession().setMode("ace/mode/json");
    editor.setValue(initialValueRef.current);
    editorRef.current = editor;
    editor.on("change", () => {
      onChange(editor.getValue());
    });
    return () => {
      editor.destroy();
    };
  }, [onChange]);

  return <div id="editor" style={{ height: "300px" }} />;
}
