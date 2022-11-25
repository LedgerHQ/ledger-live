// @flow
import React from "react";

import FormField from "./FormField";

const Form = ({ form, dependencies, value, onChange }: *) =>
  Array.isArray(form) ? (
    form.map((form, i) => (
      <Form
        dependencies={dependencies}
        key={i}
        form={form}
        value={value[i]}
        onChange={(v) => {
          const copy = value.slice(0);
          copy[i] = v;
          onChange(copy);
        }}
      />
    ))
  ) : typeof form === "object" && form ? (
    typeof form.type === "string" ? (
      <FormField
        dependencies={dependencies}
        dataType={form}
        value={value}
        onChange={onChange}
      />
    ) : (
      // $FlowFixMe
      Object.keys(form).map((key) => (
        <Form
          dependencies={dependencies}
          key={key}
          form={form[key]}
          value={value[key]}
          onChange={(v) => {
            const copy = { ...value };
            copy[key] = v;
            onChange(copy);
          }}
        />
      ))
    )
  ) : null;

export default Form;
