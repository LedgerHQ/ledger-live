# Multi-stage build for Aleo Backend REST API

# Build stage
FROM rust:1.94.1-bookworm AS builder

# Set working directory
WORKDIR /app

# Vendored-only deviation from upstream. `[profile.release] lto = "fat"` over
# snarkVM costs a double-digit-minute link step that buys the tester nothing —
# it never measures backend throughput. Set before the dependency layer so both
# cargo invocations use one profile and the cached layer stays valid.
ENV CARGO_PROFILE_RELEASE_LTO=false

# Copy dependency files first for better caching
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (this layer will be cached)
RUN cargo build --release && rm -rf src

# Copy source code
COPY src ./src
COPY contracts ./contracts

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/aleo-backend /app/aleo-backend

# Change ownership to appuser
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the default port
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3030/_health || exit 1

# Set default environment variables
ENV APP_SERVER_HOST=0.0.0.0
ENV APP_SERVER_PORT=3030
ENV APP_LOGGING_LEVEL=info

# Run the application
CMD ["./aleo-backend"]
