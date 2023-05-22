import fs from "fs";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const promisify = <F extends (...args: any) => any>(fn: any) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any
): Promise<ReturnType<F>> =>
  new Promise((resolve, reject) =>
    fn(...args, (err: Error, res: ReturnType<F>) => {
      if (err) return reject(err);
      return resolve(res);
    }),
  );
export const fsReadFile = promisify(fs.readFile);
export const fsReaddir = promisify(fs.readdir);
export const fsWriteFile = promisify(fs.writeFile);
export const fsMkdir = promisify(fs.mkdir);
export const fsUnlink = promisify(fs.unlink);
