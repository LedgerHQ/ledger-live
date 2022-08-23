// @flow
import React, { useEffect, useRef, useImperativeHandle } from "react";
import { TextInput } from "react-native";

function FocusedTextInput(props: *, ref) {
  const inputRef = useRef();
  // allows to still forward ref to parent to call
  useImperativeHandle(ref, () => inputRef.current);
  useEffect(() => {
    props.autoFocus && inputRef.current?.focus();
  }, [props, ref]);
  return <TextInput ref={inputRef} {...props} />;
}

export default React.forwardRef<*, *>(FocusedTextInput);
