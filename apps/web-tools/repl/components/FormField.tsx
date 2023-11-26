import React from "react";
import fields, { DataType } from "./fields";

const FormField = ({
  dependencies,
  dataType,
  value,
  onChange,
}: {
  dependencies: Object;
  value: any;
  onChange: (v: any) => void;
  dataType: DataType;
}) => {
  const { type, ...rest } = dataType;
  const El = fields[type];
  if (!El) return null;
  // @ts-ignore
  return <El {...rest} dependencies={dependencies} value={value} onChange={onChange} />;
};

export default FormField;
