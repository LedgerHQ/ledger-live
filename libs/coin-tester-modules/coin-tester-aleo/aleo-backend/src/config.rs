use anyhow::Result;
use config::{Config, ConfigError, Environment, File};
use serde::{Deserialize, Serialize};
use std::net::{IpAddr, Ipv4Addr};
use std::sync::OnceLock;
use tracing::Level;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AppConfig {
  pub server: ServerConfig,
  pub logging: LoggingConfig,
  /// Per-network Aleo node base URLs, used to fetch freeze lists for private stablecoin
  /// transfers. Each is the API base up to (and including) the network segment, e.g.
  /// `https://api.explorer.provable.com/v2/mainnet`. Defaults to the Provable endpoints
  /// from the Aleo docs; override via `APP_ALEO_MAINNET_URL` etc.
  #[serde(default)]
  pub aleo: AleoConfig,
}

/// Aleo node base URLs keyed by network. A network with no URL configured cannot serve freeze
/// lists (private stablecoin transfers on that network will be rejected with a clear error).
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct AleoConfig {
  pub mainnet: Option<NodeConfig>,
  pub testnet: Option<NodeConfig>,
  pub canary: Option<NodeConfig>,
}

impl Default for AleoConfig {
  /// Provable API base URLs from the Aleo private stablecoin transfer docs
  /// (https://docs.aleo.org/build/sdk/guides/transfers/private_stablecoin_transfers/).
  /// Base is the API root up to and including the network segment; `freeze_list.rs`
  /// appends `/program/{program}/mapping/{name}/{key}`. Canary has no documented
  /// endpoint, so it stays unset (override with `APP_ALEO_CANARY_URL` if needed).
  fn default() -> Self {
    Self {
      mainnet: Some(NodeConfig {
        url: "https://api.explorer.provable.com/v2/mainnet".to_string(),
      }),
      testnet: Some(NodeConfig {
        url: "https://api.explorer.provable.com/v2/testnet".to_string(),
      }),
      canary: None,
    }
  }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct NodeConfig {
  pub url: String,
}

/// Process-global node URLs. Set once at startup from the loaded config (the Salvo handlers
/// have no access to `AppConfig` otherwise).
static ALEO: OnceLock<AleoConfig> = OnceLock::new();

impl AleoConfig {
  /// Install this config as the process-global. Idempotent; the first call wins.
  pub fn install_global(self) {
    let _ = ALEO.set(self);
  }

  pub fn global() -> &'static AleoConfig {
    ALEO.get_or_init(AleoConfig::default)
  }

  /// Base URL for `network` ("mainnet" / "testnet" / "canary"), if configured.
  pub fn node_url(&self, network: &str) -> Option<&str> {
    let node = match network {
      "mainnet" => self.mainnet.as_ref(),
      "testnet" => self.testnet.as_ref(),
      "canary" => self.canary.as_ref(),
      _ => None,
    };
    node.map(|n| n.url.as_str())
  }
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ServerConfig {
  pub host: IpAddr,
  pub port: u16,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct LoggingConfig {
  pub level: String,
}

impl Default for AppConfig {
  fn default() -> Self {
    Self {
      server: ServerConfig {
        host: IpAddr::V4(Ipv4Addr::new(0, 0, 0, 0)),
        port: 3030,
      },
      logging: LoggingConfig {
        level: "info".to_string(),
      },
      aleo: AleoConfig::default(),
    }
  }
}

impl AppConfig {
  /// Load configuration from file and environment variables
  pub fn load() -> Result<Self, ConfigError> {
    let config = Config::builder()
      .add_source(Config::try_from(&AppConfig::default())?)
      .add_source(File::with_name(".env").required(false))
      .add_source(
        Environment::with_prefix("APP")
          .prefix_separator("_")
          .separator("_"),
      )
      .build()?;

    config.try_deserialize()
  }

  /// Get log level as tracing Level
  pub fn log_level(&self) -> Level {
    match self.logging.level.to_lowercase().as_str() {
      "trace" => Level::TRACE,
      "debug" => Level::DEBUG,
      "info" => Level::INFO,
      "warn" => Level::WARN,
      "error" => Level::ERROR,
      _ => {
        eprintln!(
          "Invalid log level '{}', defaulting to 'info'",
          self.logging.level
        );
        Level::INFO
      }
    }
  }

  /// Get server bind address as string
  pub fn bind_address(&self) -> String {
    format!("{}:{}", self.server.host, self.server.port)
  }
}
