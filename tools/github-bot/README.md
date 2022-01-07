# live-github-bot

> A GitHub App built with [Probot](https://github.com/probot/probot) that Github bot to enhance developer experience on the ledger-live repository

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t live-github-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> live-github-bot
```

## Contributing

If you have suggestions for how live-github-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2022 Valentin D. Pinkman <valentin.d.pinkman@hey.com>
