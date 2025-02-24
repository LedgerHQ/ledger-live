import { http, HttpResponse, passthrough } from "msw";
import { setupServer } from "msw/node";

export const NEAR_BASE_URL_MOCKED = "https://near.mock";

const handlers = [
  http.post(`${NEAR_BASE_URL_MOCKED}`, async ({ request }) => {
    const data = (await request.json()) as Record<string, any>;

    if (data.params.request_type === "view_account") {
      return HttpResponse.json({
        result: {
          amount: "67152281393064900000000",
          storage_usage: 182,
          block_height: 140172439,
        },
      });
    }

    console.log("Node mock passthrought:", data);
    return passthrough();
  }),
];

export const mockServer = setupServer(...handlers);
