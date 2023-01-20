// @flow
import React from "react";
import fields from "./fields";

const FormField = ({ dependencies, dataType, value, onChange }: *) => {
  const { type, ...rest } = dataType;
  const El = fields[type];
  if (!El) return null;
  return (
    <El
      {...rest}
      dependencies={dependencies}
      value={value}
      onChange={onChange}
    />
  );
};

export default FormField;
