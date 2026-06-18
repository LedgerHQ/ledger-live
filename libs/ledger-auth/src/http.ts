import { WalletAuthHttpError } from "./errors";

export async function postJson(
  url: string,
  body: unknown,
  headers?: Record<string, string>,
): Promise<unknown> {
  return post(url, "application/json", JSON.stringify(body), headers);
}

export async function postForm(url: string, params: URLSearchParams): Promise<unknown> {
  return post(url, "application/x-www-form-urlencoded", params.toString());
}

async function post(
  url: string,
  contentType: string,
  body: string,
  headers?: Record<string, string>,
): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": contentType,
      ...headers,
    },
    body,
  });
  return parseJsonResponse(response);
}

export async function parseJsonResponse(response: Response): Promise<unknown> {
  const body = await response.text().catch(() => ""); // "" is not valid JSON, so it will throw below

  if (!response.ok) {
    throw new WalletAuthHttpError(
      `Auth HTTP error ${response.status}: ${response.statusText} - ${body}`,
      response.status,
    );
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new WalletAuthHttpError(
      `Failed to parse JSON: ${body || "(empty response)"}`,
      response.status,
    );
  }
}
