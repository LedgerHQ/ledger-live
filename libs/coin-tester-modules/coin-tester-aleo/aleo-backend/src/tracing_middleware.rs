use opentelemetry::trace::{FutureExt, SpanKind, TraceContextExt, Tracer};
use opentelemetry::{Context, KeyValue, global};
use opentelemetry_http::HeaderExtractor;
use salvo::http::headers::{self, HeaderMap, HeaderMapExt, HeaderName, HeaderValue};
use salvo::prelude::*;

/// OpenTelemetry tracing middleware for Salvo.
///
/// Sets the span name to `<HTTP method> /<matched route>` so that Datadog
/// displays it as the `resource.name`. Also sets `http.route` per OTel
/// semantic conventions.
pub struct Tracing<T> {
  tracer: T,
}

impl<T> Tracing<T> {
  pub fn new(tracer: T) -> Self {
    Self { tracer }
  }
}

impl<T: std::fmt::Debug> std::fmt::Debug for Tracing<T> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("Tracing")
      .field("tracer", &self.tracer)
      .finish()
  }
}

#[async_trait]
impl<T> Handler for Tracing<T>
where
  T: Tracer + Sync + Send + 'static,
  T::Span: Send + Sync + 'static,
{
  async fn handle(
    &self,
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
    ctrl: &mut FlowCtrl,
  ) {
    let remote_addr = req.remote_addr().to_string();
    let method = req.method().to_string();

    // Build the route-based span name: "GET /network/{network_id}/decrypt"
    let matched = req.matched_path();
    let route = if matched.is_empty() {
      req.uri().path().to_owned()
    } else {
      format!("/{matched}")
    };
    let span_name = format!("{method} {route}");

    // Extract parent context from incoming headers for distributed tracing
    let mut headers = HeaderMap::with_capacity(req.headers().len());
    headers.extend(req.headers().into_iter().map(|(name, value)| {
      let name = HeaderName::from_bytes(name.as_ref()).expect("Invalid header name");
      let value = HeaderValue::from_bytes(value.as_ref()).expect("Invalid header value");
      (name, value)
    }));
    let parent_cx =
      global::get_text_map_propagator(|propagator| propagator.extract(&HeaderExtractor(&headers)));

    let attributes = vec![
      KeyValue::new("http.request.method", method),
      KeyValue::new("url.full", req.uri().to_string()),
      KeyValue::new("client.address", remote_addr),
      KeyValue::new("network.protocol.version", format!("{:?}", req.version())),
      KeyValue::new("http.route", route),
      // Datadog displays resource.name instead of the span name
      KeyValue::new("resource.name", span_name.clone()),
    ];

    let span = self
      .tracer
      .span_builder(span_name)
      .with_kind(SpanKind::Server)
      .with_attributes(attributes)
      .start_with_context(&self.tracer, &parent_cx);

    async move {
      ctrl.call_next(req, depot, res).await;

      let cx = Context::current();
      let span = cx.span();

      let status = res.status_code.unwrap_or(StatusCode::OK);
      span.set_attribute(KeyValue::new(
        "http.response.status_code",
        status.as_u16() as i64,
      ));
      if let Some(content_length) = res.headers().typed_get::<headers::ContentLength>() {
        span.set_attribute(KeyValue::new(
          "http.response.header.content-length",
          content_length.0 as i64,
        ));
      }
    }
    .with_context(Context::current_with_span(span))
    .await
  }
}
