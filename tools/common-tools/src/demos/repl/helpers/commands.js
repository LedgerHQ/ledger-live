// @flow
// TODO: move to typescript
import type Transport from "@ledgerhq/hw-transport";
import type { Observable } from "rxjs";
import type { DataType } from "../components/fields";

type Exec = (
  Transport<*>,
  ...formValues: any
) => Promise<any> | Observable<any>;

export type Deps = {
  [_: string]: (Transport<any>, ...a: any) => Promise<any>,
};

// eslint-disable-next-line no-use-before-define
export type Form = DataType | FormObj | Form[];
// eslint-disable-next-line no-use-before-define
type FormObj = { [_: string]: Form };

export type Command = {
  id: string,
  // a function that execute something with the transport asynchronously
  exec: Exec,
  // form is an array/object that describe what the formValues are.
  // e.g. if there are 2 extra arg, form will be a array of 2 descriptors.
  // if there is one arg that is an object with 2 values, it will be an object that reject the same shape.
  form: Form[],

  mapArgs?: (args: any[], dependencies: Object) => any,

  dependencies?: Deps,
};

export const cmd = (id: string, exec: Exec, ...form: Form[]) => ({
  id,
  exec,
  form,
});

export const resolveDependencies = (
  c: Command,
  transport: Transport<*>
): Promise<Object> => {
  const deps = c.dependencies || {};
  return Object.keys(deps).reduce(
    (p, k) =>
      p.then((obj) =>
        deps[k](transport).then((value) => ({
          ...obj,
          [k]: value,
        }))
      ),
    Promise.resolve({})
  );
};

export const getDefaultValue = (form: Form) => {
  if (Array.isArray(form)) {
    return form.map(getDefaultValue);
  }
  if (typeof form.type === "string") {
    return form.default;
  }
  const copy = {};
  for (const key in form) {
    copy[key] = getDefaultValue(form[key]);
  }
  return copy;
};

const defaultMapArgs = (a, _d) => a;

export const execCommand = (
  c: Command,
  transport: Transport<*>,
  value: Form[],
  dependencies: Object
): Promise<*> | Observable<*> => {
  console.log("exec: " + c.id, value);
  // before exec each command, we assume to be in dashboard.
  // js code should override that otherwise.
  // TODO we should improve live-common to do that in all commands!
  transport.setScrambleKey("B0L0S");
  const mapArgs = c.mapArgs || defaultMapArgs;
  return c.exec(transport, ...mapArgs(value, dependencies));
};
