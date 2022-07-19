import qs from "qs";
import network from "../../../network";

/**
 *
 * @param path
 * @param params
 * @returns path + params
 */
const makeUrl = (path: string, params?: Record<string, string>) => {
  let url = path;
  if (params) {
    const parsedParams = qs.stringify(params);
    url += `?${parsedParams}`;
  }
  return url;
};

/**
 *
 * @param path to append to root url.
 * @param params for api request.
 * @returns data fetched from api.
 */
export async function fetch(
  path: string,
  params?: Record<string, string>
): Promise<any> {
  const url = makeUrl(path, params);
  const { data } = await network({
    method: "GET",
    url,
    headers: { "User-Agent": "LedgerLive" },
  });
  return data;
}

/**
 *
 * @param path to append to root url.
 * @param params for api request.
 * @param acc
 * @param cursor
 * @returns data fetched from api.
 */
export const fetchAll = async (
  path: string,
  params: Record<string, string>,
  acc: any[] = [],
  cursor?: string
): Promise<any> => {
  const { data, cursor: nextCursor } = await fetch(path, {
    ...params,
    ...(cursor ? { cursor } : undefined),
  });
  const accData = [...acc, ...data];

  if (nextCursor) {
    const nextData = await fetchAll(path, params, accData, nextCursor);
    return nextData;
  }

  return accData;
};
