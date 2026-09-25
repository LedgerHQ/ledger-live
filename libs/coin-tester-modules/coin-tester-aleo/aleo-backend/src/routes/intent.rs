use std::collections::HashMap;
use std::fmt;
use std::str::FromStr;

use crate::config::AleoConfig;
use crate::core::common::parse_string;
use crate::core::intent_utils::compute_record_commitment;
use crate::core::tlv::{TLVVersion, encode_request};
use crate::core::{
  self, PreparedRequest as CorePreparedRequest, decode_vec_from_hex, encode_to_hex,
  encode_vec_to_hex,
};
use crate::{ApiError, AppError, AppResult};
use salvo::oapi::ToSchema;
use salvo::prelude::*;
use serde::{Deserialize, Serialize};
use snarkvm::prelude::{
  Address, CanaryV0, Field, MainnetV0, Network, TestnetV0, Value, ValueType, ViewKey,
};
use tracing_opentelemetry::OpenTelemetrySpanExt;

/// Network identifier extracted from path parameter
#[derive(Debug, Clone, Copy, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum NetworkId {
  Mainnet,
  Testnet,
  Canary,
}

impl NetworkId {
  /// Get the network ID value for snarkVM
  pub fn to_network_id(&self) -> u16 {
    match self {
      NetworkId::Mainnet => MainnetV0::ID,
      NetworkId::Testnet => TestnetV0::ID,
      NetworkId::Canary => CanaryV0::ID,
    }
  }
}

impl fmt::Display for NetworkId {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      NetworkId::Mainnet => write!(f, "mainnet"),
      NetworkId::Testnet => write!(f, "testnet"),
      NetworkId::Canary => write!(f, "canary"),
    }
  }
}

impl FromStr for NetworkId {
  type Err = AppError;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    match s.to_lowercase().as_str() {
      "mainnet" => Ok(NetworkId::Mainnet),
      "testnet" => Ok(NetworkId::Testnet),
      "canary" => Ok(NetworkId::Canary),
      _ => Err(AppError::BadRequest(format!(
        "Invalid network: {}. Expected mainnet, testnet, or canary",
        s
      ))),
    }
  }
}

#[derive(Debug, Deserialize, Serialize, ToSchema, Clone)]
#[salvo(schema(example = json!({
  "owner": "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private",
  "data": {
    "microcredits": "6564640u64.private"
  },
  "nonce": "3464614586029802535577209894878281774938899585256819212454902402155441681025group",
  "version": 1
})))]
pub struct RecordContent {
  /// The owner of the program record.
  pub owner: String,
  /// The program data.
  pub data: HashMap<String, String>,
  /// The nonce of the program record.
  pub nonce: String,
  /// The version of the program record.
  ///   - Version 0 uses a BHP hash to derive the record commitment.
  ///   - Version 1 uses a BHP commitment to derive the record commitment.
  pub version: u8,
}

/// Transfer private credits to another address
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_private",
  "amount": "1000000",
  "to": "aleo1...",
  "record": {
    "owner": "aleo1...",
    "data": { "microcredits": "1000000u64.private" },
    "nonce": "...",
    "version": 0
  }
})))]
pub struct TransferPrivateIntent {
  /// Amount in microcredits
  pub amount: String,
  /// Recipient address
  pub to: String,
  /// Record content
  pub record: RecordContent,
}

/// Transfer public credits to another address
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_public",
  "amount": "1000000",
  "to": "aleo1..."
})))]
pub struct TransferPublicIntent {
  /// Amount in microcredits
  pub amount: String,
  /// Recipient address
  pub to: String,
}

/// Transfer private credits to public balance
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_private_to_public",
  "amount": "1000000",
  "to": "aleo1...",
  "record": {
    "owner": "aleo1...",
    "data": { "microcredits": "1000000u64.private" },
    "nonce": "...",
    "version": 0
  }
})))]
pub struct TransferPrivateToPublicIntent {
  /// Amount in microcredits
  pub amount: String,
  /// Recipient address
  pub to: String,
  /// Record content
  pub record: RecordContent,
}

/// Transfer private credits by joining multiple records (ldgbatcher_p28/p910/p1114.aleo)
#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct TransferPrivateManyIntent {
  /// Amount in microcredits
  pub amount: String,
  /// Recipient address
  pub to: String,
  /// Records to join (2 to 14 required)
  pub records: Vec<RecordContent>,
}

/// Batch transfer private-to-public using multiple records (ldgbatcher_ppub_28/910/1114.aleo)
#[derive(Debug, Deserialize, Serialize, ToSchema)]
pub struct TransferPrivateToPublicManyIntent {
  /// Amount in microcredits
  pub amount: String,
  /// Records to join (2 to 14 required)
  pub records: Vec<RecordContent>,
}

/// Batch private stablecoin transfer by joining multiple `Token` records
/// (`ldg_<token>_p_*` / `ldg_<token>_p2p_*`). Used for both `transfer_private` and
/// `transfer_private_to_public` batches (both carry a recipient). Routed by `program_id`; requires
/// a freeze-list exclusion proof built once for the sender.
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_token_private_2",
  "program_id": "usdcx_stablecoin.aleo",
  "amount": "2000",
  "to": "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
  "records": []
})))]
pub struct TransferTokenPrivateManyIntent {
  /// Stablecoin program ID (e.g. `usdcx_stablecoin.aleo` or `test_usdcx_stablecoin.aleo`)
  pub program_id: String,
  /// Total amount to transfer in token base units (u128)
  pub amount: String,
  /// Recipient address
  pub to: String,
  /// Sender's `Token` records to join (2 to 13 required, all owned by the sender)
  pub records: Vec<RecordContent>,
}

/// Transfer public credits to private record
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_public_to_private",
  "amount": "1000000",
  "to": "aleo1..."
})))]
pub struct TransferPublicToPrivateIntent {
  /// Amount in microcredits
  pub amount: String,
  /// Recipient address
  pub to: String,
}

/// Transfer public stablecoin tokens to another public balance.
///
/// Routed by `program_id` (the token == the program; these contracts take no `token_id`).
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_token_public",
  "program_id": "usad_stablecoin.aleo",
  "amount": "1000",
  "to": "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
})))]
pub struct TransferTokenPublicIntent {
  /// Stablecoin program ID (e.g. `usad_stablecoin.aleo`)
  pub program_id: String,
  /// Amount in token base units (u128)
  pub amount: String,
  /// Recipient address
  pub to: String,
}

/// Transfer public stablecoin tokens into a private record.
///
/// Routed by `program_id`. The recipient is a private input on-chain.
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_token_public_to_private",
  "program_id": "usad_stablecoin.aleo",
  "amount": "1000",
  "to": "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
})))]
pub struct TransferTokenPublicToPrivateIntent {
  /// Stablecoin program ID (e.g. `usad_stablecoin.aleo`)
  pub program_id: String,
  /// Amount in token base units (u128)
  pub amount: String,
  /// Recipient address
  pub to: String,
}

/// Transfer private stablecoin tokens to another address.
///
/// Routed by `program_id`. Spends a `Token.record` and requires a freeze-list exclusion proof.
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_token_private",
  "program_id": "usdcx_stablecoin.aleo",
  "amount": "1000",
  "to": "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
  "record": {
    "owner": "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs.private",
    "data": { "amount": "1000u128.private" },
    "nonce": "4160280143448500340155012572710776276584271817167581734852184173037536465819group",
    "version": 1
  }
})))]
pub struct TransferTokenPrivateIntent {
  /// Stablecoin program ID (e.g. `usad_stablecoin.aleo`)
  pub program_id: String,
  /// Amount in token base units (u128)
  pub amount: String,
  /// Recipient address (private input on-chain)
  pub to: String,
  /// Sender's Token record
  pub record: RecordContent,
}

/// Transfer private stablecoin tokens to a public balance.
///
/// Routed by `program_id`. Like [`TransferTokenPrivateIntent`] but recipient/amount are public.
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "transfer_token_private_to_public",
  "program_id": "usdcx_stablecoin.aleo",
  "amount": "1000",
  "to": "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
  "record": {
    "owner": "aleo1dtadcxqsjp4fvvafv4ynlq9mp5vgwsap7djlzell8ngag7pj3uysdlhxjs.private",
    "data": { "amount": "1000u128.private" },
    "nonce": "4160280143448500340155012572710776276584271817167581734852184173037536465819group",
    "version": 1
  }
})))]
pub struct TransferTokenPrivateToPublicIntent {
  /// Stablecoin program ID (e.g. `usad_stablecoin.aleo`)
  pub program_id: String,
  /// Amount in token base units (u128)
  pub amount: String,
  /// Recipient address (public input on-chain)
  pub to: String,
  /// Sender's Token record
  pub record: RecordContent,
}

#[derive(Debug, Deserialize, Serialize, Extractible, ToSchema, Clone)]
#[salvo(schema(example = json!({
  "max_base_fee": "1000000",
  "max_priority_fee": "123",
  "function_name": "fee_private",
})))]
pub struct FeeLimits {
  /// Base fee in microcredits
  pub max_base_fee: String,
  /// Priority fee in microcredits
  pub max_priority_fee: String,
  pub function_name: String,
}

impl FeeLimits {
  pub fn new(max_base_fee: &str, max_priority_fee: &str, function_name: &str) -> Self {
    Self {
      max_base_fee: max_base_fee.into(),
      max_priority_fee: max_priority_fee.into(),
      function_name: function_name.into(),
    }
  }
}

/// Pay fees using a private record
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "fee_private",
  "base_fee": "10000",
  "priority_fee": "100",
  "execution_id": "...",
  "record": {
    "owner": "aleo1...",
    "data": { "microcredits": "1000000u64.private" },
    "nonce": "...",
    "version": 0
  }
})))]
pub struct FeePrivateIntent {
  /// Base fee in microcredits
  pub base_fee: String,
  /// Priority fee in microcredits
  pub priority_fee: String,
  /// Execution ID of the authorization for which fees are paid
  pub execution_id: String,
  /// Record content
  pub record: RecordContent,
}

/// Pay fees using public balance
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[salvo(schema(example = json!({
  "type": "fee_public",
  "base_fee": "10000",
  "priority_fee": "100",
  "execution_id": "..."
})))]
pub struct FeePublicIntent {
  /// Base fee in microcredits
  pub base_fee: String,
  /// Priority fee in microcredits
  pub priority_fee: String,
  /// Execution ID of the authorization for which fees are paid
  pub execution_id: String,
}

/// Intent types for creating prepared requests
#[derive(Debug, Deserialize, Serialize, ToSchema)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum Intent {
  TransferPrivate(TransferPrivateIntent),
  TransferPublic(TransferPublicIntent),
  TransferPrivateToPublic(TransferPrivateToPublicIntent),
  TransferPublicToPrivate(TransferPublicToPrivateIntent),
  TransferTokenPublic(TransferTokenPublicIntent),
  TransferTokenPublicToPrivate(TransferTokenPublicToPrivateIntent),
  TransferTokenPrivate(TransferTokenPrivateIntent),
  TransferTokenPrivateToPublic(TransferTokenPrivateToPublicIntent),
  #[serde(rename = "transfer_private_2")]
  TransferPrivate2(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_3")]
  TransferPrivate3(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_4")]
  TransferPrivate4(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_5")]
  TransferPrivate5(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_6")]
  TransferPrivate6(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_7")]
  TransferPrivate7(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_8")]
  TransferPrivate8(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_9")]
  TransferPrivate9(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_10")]
  TransferPrivate10(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_11")]
  TransferPrivate11(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_12")]
  TransferPrivate12(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_13")]
  TransferPrivate13(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_14")]
  TransferPrivate14(TransferPrivateManyIntent),
  #[serde(rename = "transfer_private_to_public_2")]
  TransferPrivateToPublic2(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_3")]
  TransferPrivateToPublic3(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_4")]
  TransferPrivateToPublic4(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_5")]
  TransferPrivateToPublic5(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_6")]
  TransferPrivateToPublic6(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_7")]
  TransferPrivateToPublic7(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_8")]
  TransferPrivateToPublic8(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_9")]
  TransferPrivateToPublic9(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_10")]
  TransferPrivateToPublic10(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_11")]
  TransferPrivateToPublic11(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_12")]
  TransferPrivateToPublic12(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_13")]
  TransferPrivateToPublic13(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_private_to_public_14")]
  TransferPrivateToPublic14(TransferPrivateToPublicManyIntent),
  #[serde(rename = "transfer_token_private_2")]
  TransferTokenPrivate2(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_3")]
  TransferTokenPrivate3(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_4")]
  TransferTokenPrivate4(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_5")]
  TransferTokenPrivate5(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_6")]
  TransferTokenPrivate6(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_7")]
  TransferTokenPrivate7(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_8")]
  TransferTokenPrivate8(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_9")]
  TransferTokenPrivate9(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_10")]
  TransferTokenPrivate10(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_11")]
  TransferTokenPrivate11(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_12")]
  TransferTokenPrivate12(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_13")]
  TransferTokenPrivate13(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_2")]
  TransferTokenPrivateToPublic2(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_3")]
  TransferTokenPrivateToPublic3(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_4")]
  TransferTokenPrivateToPublic4(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_5")]
  TransferTokenPrivateToPublic5(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_6")]
  TransferTokenPrivateToPublic6(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_7")]
  TransferTokenPrivateToPublic7(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_8")]
  TransferTokenPrivateToPublic8(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_9")]
  TransferTokenPrivateToPublic9(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_10")]
  TransferTokenPrivateToPublic10(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_11")]
  TransferTokenPrivateToPublic11(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_12")]
  TransferTokenPrivateToPublic12(TransferTokenPrivateManyIntent),
  #[serde(rename = "transfer_token_private_to_public_13")]
  TransferTokenPrivateToPublic13(TransferTokenPrivateManyIntent),
  FeePrivate(FeePrivateIntent),
  FeePublic(FeePublicIntent),
}

impl Intent {
  pub fn intent_type(&self) -> &'static str {
    match self {
      Intent::TransferPrivate(_) => "transfer_private",
      Intent::TransferPublic(_) => "transfer_public",
      Intent::TransferPrivateToPublic(_) => "transfer_private_to_public",
      Intent::TransferPublicToPrivate(_) => "transfer_public_to_private",
      Intent::TransferTokenPublic(_) => "transfer_token_public",
      Intent::TransferTokenPublicToPrivate(_) => "transfer_token_public_to_private",
      Intent::TransferTokenPrivate(_) => "transfer_token_private",
      Intent::TransferTokenPrivateToPublic(_) => "transfer_token_private_to_public",
      Intent::TransferPrivate2(_) => "transfer_private_2",
      Intent::TransferPrivate3(_) => "transfer_private_3",
      Intent::TransferPrivate4(_) => "transfer_private_4",
      Intent::TransferPrivate5(_) => "transfer_private_5",
      Intent::TransferPrivate6(_) => "transfer_private_6",
      Intent::TransferPrivate7(_) => "transfer_private_7",
      Intent::TransferPrivate8(_) => "transfer_private_8",
      Intent::TransferPrivate9(_) => "transfer_private_9",
      Intent::TransferPrivate10(_) => "transfer_private_10",
      Intent::TransferPrivate11(_) => "transfer_private_11",
      Intent::TransferPrivate12(_) => "transfer_private_12",
      Intent::TransferPrivate13(_) => "transfer_private_13",
      Intent::TransferPrivate14(_) => "transfer_private_14",
      Intent::TransferPrivateToPublic2(_) => "transfer_private_to_public_2",
      Intent::TransferPrivateToPublic3(_) => "transfer_private_to_public_3",
      Intent::TransferPrivateToPublic4(_) => "transfer_private_to_public_4",
      Intent::TransferPrivateToPublic5(_) => "transfer_private_to_public_5",
      Intent::TransferPrivateToPublic6(_) => "transfer_private_to_public_6",
      Intent::TransferPrivateToPublic7(_) => "transfer_private_to_public_7",
      Intent::TransferPrivateToPublic8(_) => "transfer_private_to_public_8",
      Intent::TransferPrivateToPublic9(_) => "transfer_private_to_public_9",
      Intent::TransferPrivateToPublic10(_) => "transfer_private_to_public_10",
      Intent::TransferPrivateToPublic11(_) => "transfer_private_to_public_11",
      Intent::TransferPrivateToPublic12(_) => "transfer_private_to_public_12",
      Intent::TransferPrivateToPublic13(_) => "transfer_private_to_public_13",
      Intent::TransferPrivateToPublic14(_) => "transfer_private_to_public_14",
      Intent::TransferTokenPrivate2(_) => "transfer_token_private_2",
      Intent::TransferTokenPrivate3(_) => "transfer_token_private_3",
      Intent::TransferTokenPrivate4(_) => "transfer_token_private_4",
      Intent::TransferTokenPrivate5(_) => "transfer_token_private_5",
      Intent::TransferTokenPrivate6(_) => "transfer_token_private_6",
      Intent::TransferTokenPrivate7(_) => "transfer_token_private_7",
      Intent::TransferTokenPrivate8(_) => "transfer_token_private_8",
      Intent::TransferTokenPrivate9(_) => "transfer_token_private_9",
      Intent::TransferTokenPrivate10(_) => "transfer_token_private_10",
      Intent::TransferTokenPrivate11(_) => "transfer_token_private_11",
      Intent::TransferTokenPrivate12(_) => "transfer_token_private_12",
      Intent::TransferTokenPrivate13(_) => "transfer_token_private_13",
      Intent::TransferTokenPrivateToPublic2(_) => "transfer_token_private_to_public_2",
      Intent::TransferTokenPrivateToPublic3(_) => "transfer_token_private_to_public_3",
      Intent::TransferTokenPrivateToPublic4(_) => "transfer_token_private_to_public_4",
      Intent::TransferTokenPrivateToPublic5(_) => "transfer_token_private_to_public_5",
      Intent::TransferTokenPrivateToPublic6(_) => "transfer_token_private_to_public_6",
      Intent::TransferTokenPrivateToPublic7(_) => "transfer_token_private_to_public_7",
      Intent::TransferTokenPrivateToPublic8(_) => "transfer_token_private_to_public_8",
      Intent::TransferTokenPrivateToPublic9(_) => "transfer_token_private_to_public_9",
      Intent::TransferTokenPrivateToPublic10(_) => "transfer_token_private_to_public_10",
      Intent::TransferTokenPrivateToPublic11(_) => "transfer_token_private_to_public_11",
      Intent::TransferTokenPrivateToPublic12(_) => "transfer_token_private_to_public_12",
      Intent::TransferTokenPrivateToPublic13(_) => "transfer_token_private_to_public_13",
      Intent::FeePrivate(_) => "fee_private",
      Intent::FeePublic(_) => "fee_public",
    }
  }
}

/// Request body for creating a prepared request from an intent
#[derive(Debug, Deserialize, Serialize, Extractible, ToSchema)]
#[salvo(
  schema(example = json!({
    "intent":
    {
        "type": "transfer_private",
        "amount": "1024",
        "to": "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
        "record":
        {
            "owner": "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private",
            "data":
            {
                "microcredits": "6564640u64.private"
            },
            "nonce": "3464614586029802535577209894878281774938899585256819212454902402155441681025group",
            "version": 1
        }
    },
    "view_key": "AViewKey1pVcpDyCJBfhFi5tm9NxdfDojmUt2qwtGc5avX2JRTKcW",
    "fee": {
      "max_base_fee": "1000000",
      "max_priority_fee": "123",
      "function_name": "fee_private"
    }
})),
  extract(default_source(from = "body"))
)]
pub struct CreateIntentRequest {
  /// The intent describing the transaction to prepare
  pub intent: Intent,

  /// Optional fee settings
  pub fee: Option<FeeLimits>,

  /// Optional view key for computing record commitments (required for intents with records)
  #[serde(default, skip_serializing_if = "Option::is_none")]
  pub view_key: Option<String>,

  /// Host-supplied transition view keys (TVKs), hex-encoded field elements.
  ///
  /// A TVK (*transition view key*) is the per-transition value the device
  /// derives from its on-device Schnorr nonce. The merged-record `_nonce` of
  /// each `join` is computed as `HashToScalar(tvk, idx) * G`, so the backend
  /// needs the TVKs to assemble intermediate records without ever seeing the
  /// nonce `r` — this is what closes the `r_hint` vulnerability (ADR005).
  ///
  /// Order matters: provide exactly one TVK per transition in signing-session
  /// order, so the **first element MUST be the root transition's TVK**
  /// (transition index 0), followed by each nested transition:
  /// `[root, join_1, ..., join_{N-1}, transfer]`. For an `N`-record batch that
  /// is exactly `N + 1` TVKs (the fee transition is a separate request). The
  /// backend consumes the TVK at each join's transition index and returns 400
  /// if the count does not match, or if more than 32 (the per-session cap) are
  /// supplied.
  #[serde(default, skip_serializing_if = "Vec::is_empty")]
  pub tvks: Vec<String>,

  /// Optional TLV version (defaults to V1 if not specified)
  #[serde(default)]
  pub tlv_version: Option<u8>,
}

/// A prepared request with serialized data ready for signing (API response format)
///
/// All binary data is hex-encoded for easy debugging and SDK compatibility.
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[salvo(schema(example = json!({
  "is_root": true,
  "network_id": 1,
  "program_id": "0763726564697473",
  "function_name": "0f7472616e736665725f7075626c6963",
  "inputs": ["00000097f2372567511..."],
  "input_types": ["0100", "010c"],
  "nested_calls": [],
  "record_commitments": ["0x1234..."]
})))]
pub struct PreparedRequestResponse {
  /// Whether this is the root request
  pub is_root: bool,
  /// Network ID (0=mainnet, 1=testnet, 2=canary)
  pub network_id: u16,
  /// ProgramID serialized using to_bytes_le() and hex encoded
  pub program_id: String,
  /// Function name serialized using to_bytes_le() and hex encoded
  pub function_name: String,
  /// Input values serialized using to_bytes_le() and hex encoded
  pub inputs: Vec<String>,
  /// Input types serialized using to_bytes_le() and hex encoded
  pub input_types: Vec<String>,
  /// Nested calls (recursive structure, only for root)
  #[serde(default, skip_serializing_if = "Vec::is_empty")]
  pub nested_calls: Vec<PreparedRequestResponse>,
  /// Record commitments for each record input, in parameter order (hex encoded field elements)
  #[serde(default, skip_serializing_if = "Vec::is_empty")]
  pub record_commitments: Vec<String>,
  /// TLV encoded request (hex encoded)
  pub tlv: String,
}

/// Compute record commitments for all record inputs in a prepared request
fn compute_record_commitments<N: Network>(
  request: &CorePreparedRequest<N>,
  view_key: &ViewKey<N>,
) -> AppResult<Vec<Field<N>>> {
  let mut commitments: Vec<Field<N>> = vec![];

  for (input, input_type) in request.inputs.iter().zip(request.input_types.iter()) {
    if let ValueType::Record(record_name) = input_type {
      let record = match input {
        Value::Record(record) => record,
        _ => {
          return Err(AppError::InvalidRecord(
            "Expected a record input but found a different type".to_string(),
          ));
        }
      };

      let (commitment, _) =
        compute_record_commitment(record, record_name, &request.program_id, view_key)
          .map_err(|e| AppError::InvalidRecord(format!("Failed to compute commitment: {}", e)))?;

      commitments.push(commitment);
    }
  }

  Ok(commitments)
}

fn validate_request<N: Network>(
  request: &CorePreparedRequest<N>,
  fee_limits: &Option<FeeLimits>,
) -> AppResult<()> {
  let function_name = request.function_name.to_string();

  if function_name == "fee_public" || function_name == "fee_private" {
    // Skip validation for fee_public and fee_private - we do not need fee object with those intents
    return Ok(());
  }

  if request.is_root && fee_limits.is_none() {
    return Err(AppError::BadRequest(
      "Missing `fee` object (max_base_fee, max_priority_fee, function_name)".to_string(),
    ));
  };

  Ok(())
}

/// Convert a core PreparedRequest to API response format (hex encoded)
fn prepared_request_to_response<N: Network>(
  request: &CorePreparedRequest<N>,
  view_key: Option<&ViewKey<N>>,
  fee_limits: Option<FeeLimits>,
  tlv_version: TLVVersion,
) -> AppResult<PreparedRequestResponse> {
  validate_request(request, &fee_limits)?;

  let program_id = encode_to_hex(&request.program_id)?;
  let function_name = encode_to_hex(&request.function_name)?;
  let inputs = encode_vec_to_hex(&request.inputs)?;
  let input_types = encode_vec_to_hex(&request.input_types)?;

  let nested_calls = request
    .nested_calls
    .iter()
    .map(|nested| prepared_request_to_response(nested, view_key, None, tlv_version))
    .collect::<AppResult<Vec<_>>>()?;

  let record_commitments = if let Some(vk) = view_key {
    compute_record_commitments(request, vk)?
  } else {
    Vec::new()
  };

  let encoded_record_commitments = record_commitments
    .iter()
    .map(encode_to_hex)
    .collect::<AppResult<Vec<_>>>()?;

  let tlv = encode_request(tlv_version, request, fee_limits, record_commitments)?;

  Ok(PreparedRequestResponse {
    is_root: request.is_root,
    network_id: request.network_id,
    program_id,
    function_name,
    inputs,
    input_types,
    nested_calls,
    record_commitments: encoded_record_commitments,
    tlv,
  })
}

macro_rules! dispatch_private_many {
  ($i:expr, $network_id:expr, $signer:expr, $tvks:expr) => {{
    let amount = parse_string(&$i.amount)?;
    core::create_transfer_private_batch_request(
      $network_id,
      amount,
      &$i.to,
      &$i.records,
      $signer.as_ref(),
      $tvks,
    )
  }};
}

macro_rules! dispatch_private_to_public_many {
  ($i:expr, $network_id:expr, $signer:expr, $tvks:expr) => {{
    let amount = parse_string(&$i.amount)?;
    core::create_transfer_private_to_public_batch_request(
      $network_id,
      amount,
      &$i.records,
      $signer.as_ref(),
      $tvks,
    )
  }};
}

/// Dispatch a batch stablecoin private transfer. Builds the single freeze-list exclusion proof for
/// the sender (the records' shared owner) from the fetched snapshot, then calls `$builder`.
macro_rules! dispatch_token_private_many {
  ($builder:path, $i:expr, $network_id:expr, $signer:expr, $tvks:expr, $freeze:expr) => {{
    let amount = parse_string::<u128>(&$i.amount)?;
    let snapshot = $freeze.ok_or_else(|| {
      AppError::InternalServerError(anyhow::anyhow!(
        "Freeze list not fetched for token batch transfer"
      ))
    })?;

    if $i.records.len() < 2 {
      return Err(AppError::BadRequest(
        "Token batch requires at least 2 records".to_string(),
      ));
    }

    let owner = $i
      .records
      .first()
      .map(|r| r.owner.as_str())
      .ok_or_else(|| {
        AppError::BadRequest("Token batch requires at least one record".to_string())
      })?;
    let merkle_proof = build_freeze_proof::<N>(snapshot, owner)?;
    $builder(
      $network_id,
      &$i.program_id,
      amount,
      &$i.to,
      &$i.records,
      &merkle_proof,
      $signer.as_ref(),
      $tvks,
    )
  }};
}

/// Build the `[MerkleProof; 2]` freeze-list exclusion proof literal for a token-private
/// transfer from a fetched snapshot, deriving the sender from the spent record's owner and
/// asserting the locally-recomputed root matches the on-chain root.
fn build_freeze_proof<N: Network>(
  snapshot: &core::freeze_list::FreezeListSnapshot,
  record_owner: &str,
) -> AppResult<String> {
  let addresses = snapshot
    .addresses
    .iter()
    .map(|a| Address::<N>::from_str(a))
    .collect::<Result<Vec<_>, _>>()
    .map_err(|e| AppError::InternalServerError(anyhow::anyhow!("Bad frozen address: {e}")))?;

  // Record owner is `aleo1....private`; the address is the part before the visibility suffix.
  let sender_str = record_owner.split('.').next().unwrap_or(record_owner);
  let sender = Address::<N>::from_str(sender_str)
    .map_err(|e| AppError::InvalidIntent(format!("Invalid record owner address: {e}")))?;

  let (proof, local_root) = core::freeze_list::build_exclusion_proof(&addresses, &sender)?;

  let on_chain_root = Field::<N>::from_str(&snapshot.root).map_err(|e| {
    AppError::InternalServerError(anyhow::anyhow!(
      "Bad on-chain root '{}': {e}",
      snapshot.root
    ))
  })?;
  if local_root != on_chain_root {
    return Err(AppError::InternalServerError(anyhow::anyhow!(
      "Computed freeze-list root {local_root} does not match on-chain root {on_chain_root}; freeze list may have changed mid-request"
    )));
  }
  Ok(proof)
}

/// Process an intent and create a prepared request for a specific network. `freeze_list` is the
/// freeze-list snapshot fetched by the handler; it is required for the token-private transfers.
fn process_intent<N: Network>(
  network_id: u16,
  intent: &Intent,
  signer_address: Option<Address<N>>,
  tvks: &[Field<N>],
  freeze_list: Option<&core::freeze_list::FreezeListSnapshot>,
) -> AppResult<CorePreparedRequest<N>> {
  match intent {
    Intent::TransferPrivate(i) => {
      let amount = parse_string(&i.amount)?;
      core::create_transfer_private_request(network_id, amount, &i.to, &i.record)
    }
    Intent::TransferPublic(i) => {
      let amount = parse_string(&i.amount)?;
      core::create_transfer_public_request(network_id, amount, &i.to)
    }
    Intent::TransferPrivateToPublic(i) => {
      let amount = parse_string(&i.amount)?;
      core::create_transfer_private_to_public_request(network_id, amount, &i.to, &i.record)
    }
    Intent::TransferPublicToPrivate(i) => {
      let amount = parse_string(&i.amount)?;
      core::create_transfer_public_to_private_request(network_id, amount, &i.to)
    }
    Intent::TransferTokenPublic(i) => {
      let amount = parse_string::<u128>(&i.amount)?;
      core::create_transfer_token_public_request(network_id, &i.program_id, amount, &i.to)
    }
    Intent::TransferTokenPublicToPrivate(i) => {
      let amount = parse_string::<u128>(&i.amount)?;
      core::create_transfer_token_public_to_private_request(
        network_id,
        &i.program_id,
        amount,
        &i.to,
      )
    }
    Intent::TransferTokenPrivate(i) => {
      let amount = parse_string::<u128>(&i.amount)?;
      let snapshot = freeze_list.ok_or_else(|| {
        AppError::InternalServerError(anyhow::anyhow!(
          "Freeze list not fetched for transfer_private"
        ))
      })?;
      let merkle_proof = build_freeze_proof::<N>(snapshot, &i.record.owner)?;
      core::create_transfer_token_private_request(
        network_id,
        &i.program_id,
        amount,
        &i.to,
        &i.record,
        &merkle_proof,
      )
    }
    Intent::TransferTokenPrivateToPublic(i) => {
      let amount = parse_string::<u128>(&i.amount)?;
      let snapshot = freeze_list.ok_or_else(|| {
        AppError::InternalServerError(anyhow::anyhow!(
          "Freeze list not fetched for transfer_private_to_public"
        ))
      })?;
      let merkle_proof = build_freeze_proof::<N>(snapshot, &i.record.owner)?;
      core::create_transfer_token_private_to_public_request(
        network_id,
        &i.program_id,
        amount,
        &i.to,
        &i.record,
        &merkle_proof,
      )
    }
    Intent::TransferPrivate2(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate3(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate4(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate5(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate6(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate7(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate8(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate9(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate10(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate11(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate12(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate13(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivate14(i) => dispatch_private_many!(i, network_id, signer_address, tvks),
    Intent::TransferPrivateToPublic2(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic3(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic4(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic5(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic6(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic7(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic8(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic9(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic10(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic11(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic12(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic13(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferPrivateToPublic14(i) => {
      dispatch_private_to_public_many!(i, network_id, signer_address, tvks)
    }
    Intent::TransferTokenPrivate2(i)
    | Intent::TransferTokenPrivate3(i)
    | Intent::TransferTokenPrivate4(i)
    | Intent::TransferTokenPrivate5(i)
    | Intent::TransferTokenPrivate6(i)
    | Intent::TransferTokenPrivate7(i)
    | Intent::TransferTokenPrivate8(i)
    | Intent::TransferTokenPrivate9(i)
    | Intent::TransferTokenPrivate10(i)
    | Intent::TransferTokenPrivate11(i)
    | Intent::TransferTokenPrivate12(i)
    | Intent::TransferTokenPrivate13(i) => dispatch_token_private_many!(
      core::create_transfer_token_private_batch_request,
      i,
      network_id,
      signer_address,
      tvks,
      freeze_list
    ),
    Intent::TransferTokenPrivateToPublic2(i)
    | Intent::TransferTokenPrivateToPublic3(i)
    | Intent::TransferTokenPrivateToPublic4(i)
    | Intent::TransferTokenPrivateToPublic5(i)
    | Intent::TransferTokenPrivateToPublic6(i)
    | Intent::TransferTokenPrivateToPublic7(i)
    | Intent::TransferTokenPrivateToPublic8(i)
    | Intent::TransferTokenPrivateToPublic9(i)
    | Intent::TransferTokenPrivateToPublic10(i)
    | Intent::TransferTokenPrivateToPublic11(i)
    | Intent::TransferTokenPrivateToPublic12(i)
    | Intent::TransferTokenPrivateToPublic13(i) => dispatch_token_private_many!(
      core::create_transfer_token_private_to_public_batch_request,
      i,
      network_id,
      signer_address,
      tvks,
      freeze_list
    ),
    Intent::FeePrivate(i) => {
      let base_fee = parse_string(&i.base_fee)?;
      let priority_fee = parse_string(&i.priority_fee)?;
      core::create_fee_private_request(
        network_id,
        base_fee,
        priority_fee,
        &i.execution_id,
        &i.record,
      )
    }
    Intent::FeePublic(i) => {
      let base_fee = parse_string(&i.base_fee)?;
      let priority_fee = parse_string(&i.priority_fee)?;
      core::create_fee_public_request(network_id, base_fee, priority_fee, &i.execution_id)
    }
  }
}

/// Parse view key string into ViewKey for the specified network
fn parse_view_key<N: Network>(view_key_str: &str) -> AppResult<ViewKey<N>> {
  ViewKey::from_str(view_key_str)
    .map_err(|e| AppError::InvalidViewKey(format!("Failed to parse view key: {}", e)))
}

fn process_for_network<N: Network>(
  network_id: u16,
  request: CreateIntentRequest,
  tlv_version: TLVVersion,
  freeze_list: Option<&core::freeze_list::FreezeListSnapshot>,
) -> AppResult<PreparedRequestResponse> {
  let view_key = request
    .view_key
    .as_ref()
    .map(|vk| parse_view_key::<N>(vk))
    .transpose()?;
  let signer_address = view_key
    .as_ref()
    .map(Address::<N>::try_from)
    .transpose()
    .map_err(|e| {
      AppError::InvalidViewKey(format!("Failed to derive address from view key: {}", e))
    })?;
  let tvks: Vec<Field<N>> = decode_vec_from_hex(&request.tvks)?;
  // Global sanity bound: a device signing session is capped at 32 transitions
  // (31 + fee), so no request can legitimately carry more TVKs than that.
  if tvks.len() > core::intent::MAX_SESSION_TRANSITIONS {
    return Err(AppError::BadRequest(format!(
      "Too many TVKs: {} supplied, a signing session is capped at {}",
      tvks.len(),
      core::intent::MAX_SESSION_TRANSITIONS
    )));
  }
  let prepared = process_intent::<N>(
    network_id,
    &request.intent,
    signer_address,
    &tvks,
    freeze_list,
  )?;
  prepared_request_to_response(&prepared, view_key.as_ref(), request.fee, tlv_version)
}

#[endpoint(
  operation_id = "create_intent",
  tags("transactions"),
  summary = "Create a prepared request from an intent",
  description = "Create a prepared request from an intent. The prepared request contains serialized data ready to be signed by a hardware wallet. If view_key is provided, record commitments will be computed and included in the response.",
  parameters(
    ("network_id" = String, Path, description = "Network identifier (mainnet, testnet, canary)")
  ),
  request_body = CreateIntentRequest,
  status_codes(200, 400, 500),
  responses(
    (status_code = 200, description = "Prepared request ready for signing", body = PreparedRequestResponse),
    (status_code = 400, body = ApiError),
    (status_code = 500, body = ApiError),
  )
)]
pub async fn handle_create_intent(
  req: &mut Request,
  depot: &mut Depot,
) -> AppResult<Json<PreparedRequestResponse>> {
  let network_id_str = req
    .param::<String>("network_id")
    .ok_or_else(|| AppError::BadRequest("Missing network_id parameter".to_string()))?;

  let network = NetworkId::from_str(&network_id_str)?;

  let request: CreateIntentRequest = req
    .extract(depot)
    .await
    .map_err(|e| AppError::BadRequest(e.to_string()))?;

  let span = tracing::Span::current();
  span.set_attribute("network", network.to_string());
  span.set_attribute("intent_type", request.intent.intent_type());
  span.set_attribute("has_view_key", request.view_key.is_some());

  tracing::info!(
    "Received create intent request (network={:?}, intent={:?}, has_view_key={})",
    network,
    request.intent,
    request.view_key.is_some()
  );

  let tlv_version = match request.tlv_version {
    Some(v) => TLVVersion::try_from(v)?,
    None => TLVVersion::V1,
  };

  // Private stablecoin transfers need the on-chain freeze list to build the exclusion proof.
  let stablecoin_program = match &request.intent {
    Intent::TransferTokenPrivate(i) => Some(i.program_id.as_str()),
    Intent::TransferTokenPrivateToPublic(i) => Some(i.program_id.as_str()),
    Intent::TransferTokenPrivate2(i)
    | Intent::TransferTokenPrivate3(i)
    | Intent::TransferTokenPrivate4(i)
    | Intent::TransferTokenPrivate5(i)
    | Intent::TransferTokenPrivate6(i)
    | Intent::TransferTokenPrivate7(i)
    | Intent::TransferTokenPrivate8(i)
    | Intent::TransferTokenPrivate9(i)
    | Intent::TransferTokenPrivate10(i)
    | Intent::TransferTokenPrivate11(i)
    | Intent::TransferTokenPrivate12(i)
    | Intent::TransferTokenPrivate13(i)
    | Intent::TransferTokenPrivateToPublic2(i)
    | Intent::TransferTokenPrivateToPublic3(i)
    | Intent::TransferTokenPrivateToPublic4(i)
    | Intent::TransferTokenPrivateToPublic5(i)
    | Intent::TransferTokenPrivateToPublic6(i)
    | Intent::TransferTokenPrivateToPublic7(i)
    | Intent::TransferTokenPrivateToPublic8(i)
    | Intent::TransferTokenPrivateToPublic9(i)
    | Intent::TransferTokenPrivateToPublic10(i)
    | Intent::TransferTokenPrivateToPublic11(i)
    | Intent::TransferTokenPrivateToPublic12(i)
    | Intent::TransferTokenPrivateToPublic13(i) => Some(i.program_id.as_str()),
    _ => None,
  };
  let freeze_list = match stablecoin_program {
    Some(program) => {
      let node_base = AleoConfig::global()
        .node_url(&network.to_string())
        .ok_or_else(|| {
          AppError::BadRequest(format!(
            "No Aleo node URL configured for network '{network}'"
          ))
        })?;
      let freezelist_program = core::freeze_list::freezelist_program_for(program)?;
      Some(core::freeze_list::fetch_freeze_list(node_base, &freezelist_program).await?)
    }
    None => None,
  };

  let response = match network {
    NetworkId::Mainnet => process_for_network::<MainnetV0>(
      network.to_network_id(),
      request,
      tlv_version,
      freeze_list.as_ref(),
    )?,
    NetworkId::Testnet => process_for_network::<TestnetV0>(
      network.to_network_id(),
      request,
      tlv_version,
      freeze_list.as_ref(),
    )?,
    NetworkId::Canary => process_for_network::<CanaryV0>(
      network.to_network_id(),
      request,
      tlv_version,
      freeze_list.as_ref(),
    )?,
  };

  Ok(Json(response))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_transfer_private_2_request_payload() {
    let payload = r#"{
      "intent": {
        "type": "transfer_private_2",
        "amount": "1000000",
        "to": "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc",
        "records": [
          {
            "owner": "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private",
            "data": { "microcredits": "6564640u64.private" },
            "nonce": "3464614586029802535577209894878281774938899585256819212454902402155441681025group",
            "version": 1
          },
          {
            "owner": "aleo12e9edalrka4j9fdm22dzw3rhhv6jnpr5nnplge7utc6x2l54syfq9wcjwu.private",
            "data": { "microcredits": "2000000u64.private" },
            "nonce": "3464614586029802535577209894878281774938899585256819212454902402155441681025group",
            "version": 1
          }
        ]
      },
      "view_key": "AViewKey1pVcpDyCJBfhFi5tm9NxdfDojmUt2qwtGc5avX2JRTKcW",
      "fee": {
        "max_base_fee": "1000000",
        "max_priority_fee": "123",
        "function_name": "fee_private"
      }
    }"#;

    let request: CreateIntentRequest =
      serde_json::from_str(payload).expect("payload should deserialize into CreateIntentRequest");

    assert_eq!(
      request.view_key.as_deref(),
      Some("AViewKey1pVcpDyCJBfhFi5tm9NxdfDojmUt2qwtGc5avX2JRTKcW")
    );
    let fee = request.fee.expect("fee should be present");
    assert_eq!(fee.max_base_fee, "1000000");
    assert_eq!(fee.max_priority_fee, "123");
    assert_eq!(fee.function_name, "fee_private");

    match request.intent {
      Intent::TransferPrivate2(i) => {
        assert_eq!(i.amount, "1000000");
        assert_eq!(
          i.to,
          "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc"
        );
        assert_eq!(i.records.len(), 2);
        assert_eq!(i.records[0].version, 1);
        assert_eq!(i.records[1].version, 1);
        assert_eq!(
          i.records[0].data.get("microcredits").map(String::as_str),
          Some("6564640u64.private")
        );
        assert_eq!(
          i.records[1].data.get("microcredits").map(String::as_str),
          Some("2000000u64.private")
        );
      }
      other => panic!("expected TransferPrivate2 variant, got {:?}", other),
    }
  }
}
