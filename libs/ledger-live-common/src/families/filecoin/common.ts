export const getPath = (path: string) => (path && path.substr(0, 2) !== "m/" ? `m/${path}` : path);
