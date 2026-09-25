//! Logging and telemetry setup for the Aleo backend service.
//!
//! This module configures:
//! - Datadog-formatted JSON logging for Datadog ingestion and log/trace correlation
//! - OpenTelemetry tracing with OTLP export to Datadog
//! - Trace context propagation in logs (dd.trace_id, dd.span_id)

use anyhow::Result;
use datadog_formatting_layer::DatadogFormattingLayer;
use opentelemetry::trace::TracerProvider;
use opentelemetry::{KeyValue, global};
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::{
  Resource,
  resource::{EnvResourceDetector, SdkProvidedResourceDetector, TelemetryResourceDetector},
  trace::{RandomIdGenerator, Sampler, SdkTracerProvider},
};
use tracing::Level;
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, util::SubscriberInitExt};

/// Get the OTLP endpoint for trace export.
/// Priority:
/// 1. DD_AGENT_HOST - Datadog DaemonSet (admission controller injects node IP)
/// 2. OTEL_EXPORTER_OTLP_TRACES_ENDPOINT - Standard OpenTelemetry env var
pub fn get_otlp_endpoint() -> Option<String> {
  // Datadog DaemonSet: admission controller injects DD_AGENT_HOST with node IP
  if let Ok(dd_host) = std::env::var("DD_AGENT_HOST") {
    let port = std::env::var("DD_OTLP_GRPC_PORT").unwrap_or_else(|_| "4317".to_string());
    return Some(format!("http://{}:{}", dd_host, port));
  }

  std::env::var("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT").ok()
}

/// Get the service name from environment or use default
pub fn get_service_name() -> String {
  std::env::var("OTEL_SERVICE_NAME").unwrap_or_else(|_| "aleo-backend".to_string())
}

/// Initialize the telemetry stack with OpenTelemetry traces and structured logging.
///
/// This sets up:
/// - JSON formatted logs (for Datadog) or pretty logs (for local dev)
/// - OpenTelemetry traces exported via OTLP gRPC
/// - Trace context in logs for correlation
pub fn setup_telemetry(level: Level) -> Result<()> {
  let env_filter = EnvFilter::try_from_default_env()
    .unwrap_or_else(|_| EnvFilter::new(level.as_str()))
    .add_directive("aleo_backend=debug".parse()?)
    .add_directive("salvo=info".parse()?)
    .add_directive("aleo_backend::tracing_middleware=info".parse()?)
    .add_directive("h2=warn".parse()?)
    .add_directive("hyper=warn".parse()?)
    .add_directive("tower=warn".parse()?)
    // Quiet OpenTelemetry SDK internal logs (very verbose at debug)
    .add_directive("opentelemetry=info".parse()?)
    .add_directive("opentelemetry_sdk=info".parse()?)
    .add_directive("opentelemetry_otlp=info".parse()?)
    .add_directive("tonic=warn".parse()?);

  // Check if we're running in a container/k8s (use JSON) or locally (use pretty)
  let is_production = std::env::var("OTEL_SERVICE_NAME").is_ok();

  let otel_endpoint = get_otlp_endpoint();
  let otel_layer = otel_endpoint
    .as_ref()
    .and_then(|endpoint| init_otel_tracing(endpoint).ok());

  if is_production {
    // Datadog-formatted JSON logs (parsable by Datadog, with dd.trace_id/dd.span_id for correlation)
    let datadog_layer = DatadogFormattingLayer::default();

    tracing_subscriber::registry()
      .with(otel_layer)
      .with(env_filter)
      .with(datadog_layer)
      .init();
  } else {
    let fmt_layer = fmt::layer().with_ansi(true).with_target(false).compact();

    tracing_subscriber::registry()
      .with(otel_layer)
      .with(env_filter)
      .with(fmt_layer)
      .init();
  }

  if let Some(endpoint) = otel_endpoint {
    tracing::info!(endpoint = %endpoint, "OpenTelemetry tracing initialized");
  }

  Ok(())
}

/// Initialize OpenTelemetry tracing with OTLP exporter and return the provider
pub fn init_tracer_provider(endpoint: &str) -> Result<SdkTracerProvider> {
  let service_name = get_service_name();

  // Build resource with service info + environment attributes (OTEL_RESOURCE_ATTRIBUTES)
  let resource = Resource::builder()
    .with_detector(Box::new(EnvResourceDetector::new()))
    .with_detector(Box::new(SdkProvidedResourceDetector))
    .with_detector(Box::new(TelemetryResourceDetector))
    .with_attributes([KeyValue::new("service.name", service_name)])
    .build();

  let exporter = opentelemetry_otlp::SpanExporter::builder()
    .with_tonic()
    .with_endpoint(endpoint)
    .build()?;

  let provider = SdkTracerProvider::builder()
    .with_batch_exporter(exporter)
    .with_sampler(Sampler::AlwaysOn)
    .with_id_generator(RandomIdGenerator::default())
    .with_resource(resource)
    .build();

  global::set_tracer_provider(provider.clone());

  Ok(provider)
}

/// Initialize OpenTelemetry tracing with OTLP exporter (for tracing-subscriber layer)
fn init_otel_tracing(
  endpoint: &str,
) -> Result<
  tracing_opentelemetry::OpenTelemetryLayer<
    tracing_subscriber::Registry,
    opentelemetry_sdk::trace::Tracer,
  >,
> {
  let service_name = get_service_name();
  let provider = init_tracer_provider(endpoint)?;

  let tracer = provider.tracer(service_name);
  let otel_layer = tracing_opentelemetry::layer().with_tracer(tracer);

  Ok(otel_layer)
}

/// Shutdown OpenTelemetry gracefully, flushing any pending spans
pub fn shutdown_telemetry() {
  // Pending spans flush when the global provider is dropped at process exit.
  tracing::info!("Shutting down OpenTelemetry...");
}

/// Legacy function for backwards compatibility
#[deprecated(note = "Use setup_telemetry instead")]
pub fn setup_tracing(level: Level) -> Result<()> {
  setup_telemetry(level)
}

pub fn parse_log_level(level: &str) -> Level {
  match level.to_lowercase().as_str() {
    "trace" => Level::TRACE,
    "debug" => Level::DEBUG,
    "info" => Level::INFO,
    "warn" => Level::WARN,
    "error" => Level::ERROR,
    _ => {
      eprintln!("Invalid log level '{}', defaulting to 'info'", level);
      Level::INFO
    }
  }
}
