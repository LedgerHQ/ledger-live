pub mod authorization;
pub mod decrypt;
pub mod intent;
pub mod system;

pub mod encrypt;

use authorization::handle_create_authorization;
use decrypt::handle_decrypt;
use decrypt::handle_symmetric_decrypt;
use encrypt::handle_encrypt_proving;
use encrypt::handle_encrypt_registration;
use intent::handle_create_intent;
use opentelemetry::global;
use opentelemetry::trace::TracerProvider;
use salvo::oapi::OpenApi;
use salvo::oapi::swagger_ui::SwaggerUi;
use salvo::prelude::*;
use system::handle_health;

use crate::tracing_middleware::Tracing;

pub fn create_router() -> Router {
  let tracer = global::tracer_provider().tracer("salvo");

  let api_routes = Router::new().hoop(Tracing::new(tracer)).push(
    Router::with_path("network").push(
      Router::with_path("{network_id}")
        .push(Router::with_path("decrypt").post(handle_decrypt))
        .push(Router::with_path("symmetric_decrypt").post(handle_symmetric_decrypt))
        .push(Router::with_path("encrypt_registration").post(handle_encrypt_registration))
        .push(Router::with_path("encrypt_proving_request").post(handle_encrypt_proving))
        .push(
          Router::with_path("transactions")
            .push(Router::with_path("request").post(handle_create_intent))
            .push(Router::with_path("authorization").post(handle_create_authorization)),
        ),
    ),
  );

  // Build the full router: health and docs routes are excluded from tracing
  let router = Router::new()
    .push(Router::with_path("_health").get(handle_health))
    .push(api_routes);

  let doc = OpenApi::new(env!("CARGO_PKG_NAME"), env!("CARGO_PKG_VERSION")).merge_router(&router);

  router
    .unshift(doc.into_router("/openapi.json"))
    .unshift(SwaggerUi::new("/openapi.json").into_router("/docs"))
}
