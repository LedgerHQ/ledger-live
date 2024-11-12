export const isNoErrorReturnCode = (code: number) => code === 0x9000;

export const getPath = (path: string) => (path && path.substr(0, 2) !== "m/" ? `m/${path}` : path);

export const isError = (r: { return_code: number; error_message: string }) => {
  if (!isNoErrorReturnCode(r.return_code)) throw new Error(`${r.return_code} - ${r.error_message}`);
};
