import { server } from "./server";

server.listen({ onUnhandledRequest: "warn" });
