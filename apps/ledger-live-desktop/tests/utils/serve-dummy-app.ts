import handler from "serve-handler";
import http from "http";
import path from "path";

export const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response, {
    public: path.resolve(__dirname, "dummy-app-build"),
  });
});

export const start = (port = 60000): Promise<number> => {
  return new Promise((resolve, reject) => {
    server
      .listen(port, "localhost")
      .once("listening", () => {
        resolve((server.address() as any).port as number);
      })
      .once("error", error => {
        server.close();
        reject(error);
      });
  });
};

export const stop = () => server.close();
