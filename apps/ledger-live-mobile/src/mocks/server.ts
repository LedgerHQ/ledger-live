import { FetchInterceptor } from "@mswjs/interceptors/fetch";
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest";
import { defineNetwork, InterceptorSource } from "msw/experimental";
import handlers from "./handlers";

export const mswWorker = defineNetwork({
  sources: [
    new InterceptorSource({
      interceptors: [new FetchInterceptor(), new XMLHttpRequestInterceptor()],
    }),
  ],
  handlers,
  onUnhandledFrame: "bypass",
});
