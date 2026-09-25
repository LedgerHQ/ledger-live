use aleo_backend::{AppConfig, logger, routes};
use anyhow::{Result, anyhow};
use salvo::prelude::*;

#[tokio::main]
async fn main() -> Result<()> {
  let config = AppConfig::load().map_err(|e| anyhow!("Failed to load configuration: {}", e))?;

  // Publish the Aleo node URLs for handlers (used to fetch freeze lists).
  config.aleo.clone().install_global();

  logger::setup_telemetry(config.log_level())?;
  tracing::info!(
    config = ?config,
    "Starting Aleo backend service"
  );

  let router = routes::create_router();
  let service = Service::new(router);

  let bind_addr = config.bind_address();
  let acceptor = TcpListener::new(bind_addr).bind().await;

  let server = Server::new(acceptor);
  let handle = server.handle();

  tokio::spawn(async move {
    tokio::signal::ctrl_c().await.ok();
    tracing::info!("Received shutdown signal, gracefully shutting down...");
    handle.stop_graceful(std::time::Duration::from_secs(5));
  });

  server.serve(service).await;

  // Flush OpenTelemetry traces before exit
  logger::shutdown_telemetry();

  Ok(())
}
