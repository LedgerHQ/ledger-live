import { Page } from "@playwright/test";
import * as http from "http";

export class SpeculosModal {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }
  async rejectTransaction() {
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
  }

  async acceptTransaction() {
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
  }

  async pressRight() {
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/right");
  }

  async pressLeft() {
    await this.page.waitForTimeout(500);
    await this.sendRequest("button/left");
  }

  async pressBoth() {
    await this.page.waitForTimeout(500);
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
