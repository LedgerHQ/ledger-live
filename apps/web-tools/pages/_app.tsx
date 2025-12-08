import "./globals.css";
import type { AppProps } from "next/app";
import "../live-common-setup";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
