import { Page } from "@playwright/test";
import * as http from "http";

export class SpeculosModal {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async pressRight() {
    await this.sendRequest("button/right");
  }

  async pressLeft() {
    await this.sendRequest("button/left");
  }

  async pressBoth() {
    await this.sendRequest("button/both");
  }

  private async sendRequest(endpoint: string) {
    const requestOptions: http.RequestOptions = {
      method: "POST",
      hostname: "127.0.0.1",
      port: 5000,
      path: `/${endpoint}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    return new Promise<void>((resolve, reject) => {
      const req = http.request(requestOptions, res => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
        }
      });

      req.on("error", err => {
        reject(err);
      });

      req.write('{"action":"press-and-release"}');
      req.end();
    });
  }
}
