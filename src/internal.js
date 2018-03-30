//@flow

export function deprecateRenamedFunction(oldName: string, newF: Function) {
  let logged = false;
  return (...args: *) => {
    if (!logged) {
      logged = true;
      console.warn(
        `DEPRECATED: use ${newF.name} instead of ${oldName}\n`,
        new Error().stack
      );
    }
    return newF(...args);
  };
}

export function deprecateFunction(f: Function, msg: string) {
  let logged = false;
  return (...args: *) => {
    if (!logged) {
      logged = true;
      console.warn(`DEPRECATED: ${msg}\n`, new Error().stack);
    }
    return f(...args);
  };
}
