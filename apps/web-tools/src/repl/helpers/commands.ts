import type Transport from "@ledgerhq/hw-transport";
import type { Observable } from "rxjs";
import type { DataType } from "../components/fields";

type Exec = (arg: Transport, ...formValues: any) => Promise<any> | Observable<any>;

export type Deps = {
  [_: string]: (t: Transport, ...a: any) => Promise<any>;
};

export type ResolvedDeps = Record<string, any>;

export type Form = DataType | FormObj | Form[];

type FormObj = { [_: string]: Form };

// TODO we could associate more strongly D and RD
export type Command<D extends Deps = Deps, RD extends ResolvedDeps = ResolvedDeps> = {
  id: string;
  // a function that execute something with the transport asynchronously
  exec: Exec;
  // form is an array/object that describe what the formValues are.
  // e.g. if there are 2 extra arg, form will be a array of 2 descriptors.
  // if there is one arg that is an object with 2 values, it will be an object that reject the same shape.
  form: Form[];

  mapArgs?: (args: unknown[], dependencies: RD) => any;

  dependencies?: D;
};

export const cmd = (id: string, exec: Exec, ...form: Form[]) => ({
  id,
  exec,
  form,
});

export const resolveDependencies = <RD extends ResolvedDeps>(
  c: Command,
  transport: Transport,
): Promise<RD> => {
  const deps = c.dependencies || {};
  return Object.keys(deps).reduce(
    (p, k) =>
      p.then(obj =>
        deps[k](transport).then(value => ({
          ...obj,
          [k]: value,
        })),
      ),
    Promise.resolve({} as RD),
  );
};

export const getDefaultValue = (form: Form): any => {
  if (Array.isArray(form)) {
    return form.map(getDefaultValue);
  }
  if (typeof form.type === "string") {
    if ("default" in form) {
      return form.default;
    }
    return;
  }
  const copy: Record<string, any> = {};
  for (const key in form) {
    copy[key] = getDefaultValue(form[key]);
  }
  return copy;
};

const defaultMapArgs = (a: any, _d: any) => a;

export const execCommand = <D extends ResolvedDeps>(
  c: Command,
  transport: Transport,
  value: Form[],
  dependencies: D,
): Promise<any> | Observable<any> => {
  console.log("exec: " + c.id, value);
  // before exec each command, we assume to be in dashboard.
  // js code should override that otherwise.
  // TODO we should improve live-common to do that in all commands!
  transport.setScrambleKey("B0L0S");
  const mapArgs = c.mapArgs || defaultMapArgs;
  return c.exec(transport, ...mapArgs(value, dependencies));
};
