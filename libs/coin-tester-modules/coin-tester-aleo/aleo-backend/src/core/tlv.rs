use crate::core::PreparedRequest;
use crate::routes::intent::FeeLimits;
use crate::{AppError, AppResult};
use snarkvm::prelude::{Field, Network};

const LITERAL_TYPE_LENGTH: usize = 2;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum TLVVersion {
  V1 = 0x01,
}

impl TLVVersion {
  pub const fn as_u8(self) -> u8 {
    self as u8
  }

  pub const fn as_bytes(self) -> [u8; 1] {
    [self as u8]
  }
}

impl TryFrom<u8> for TLVVersion {
  type Error = AppError;
  fn try_from(value: u8) -> Result<Self, Self::Error> {
    match value {
      0x01 => Ok(TLVVersion::V1),
      _ => Err(AppError::BadRequest(format!(
        "Invalid TLV version: {}",
        value
      ))),
    }
  }
}
pub fn encode_request<N: Network>(
  version: TLVVersion,
  request: &PreparedRequest<N>,
  fee_limits: Option<FeeLimits>,
  commitments: Vec<Field<N>>,
) -> AppResult<String> {
  match version {
    TLVVersion::V1 => v1::request_to_tlv(request, fee_limits, commitments),
  }
}

pub fn decode_signature<N: Network>(
  version: TLVVersion,
  hex_data: &str,
) -> AppResult<(
  crate::core::types::RequestSignature<N>,
  snarkvm::prelude::ComputeKey<N>,
)> {
  match version {
    TLVVersion::V1 => v1::decode_signature_tlv(hex_data),
  }
}

pub mod v1 {
  use crate::core::common::parse_string;
  use crate::core::intent_utils::compute_h_generator;
  use crate::core::tlv::{LITERAL_TYPE_LENGTH, TLVVersion};
  use crate::core::{PreparedRequest, RequestSignature, decode_hex, encode_hex};
  use crate::routes::intent::FeeLimits;
  use crate::{AppError, AppResult};
  use snarkvm::prelude::*;
  use snarkvm::prelude::{Literal, Network, Plaintext, ToBytes, Value, ValueType};
  use tracing::{info, warn};

  // For tag numeric values in between [128,255]
  pub const TAG_VALUE_PREFIX_LOW: u8 = 0x81;

  // For tag numeric values in between [256, ...]
  pub const TAG_VALUE_PREFIX_HIGH: u8 = 0x82;

  const GAMMA_VALUE_LENGTH: usize = 32;

  const VERSION: TLVVersion = TLVVersion::V1;

  #[derive(Debug, Clone, Copy, PartialEq, Eq)]
  #[repr(u16)]
  #[allow(dead_code)] // Allow not all tags to be used in the current implementation
  pub enum TlvTag {
    StructureType = 0x01,
    Version = 0x02,
    Signature = 0x15,
    MaxBaseFee = 0xb0,
    MaxPriorityFee = 0xb1,
    FeeFunctionName = 0xb2,
    FeeProgramId = 0xb3,
    Request = 0xb4,
    NetworkId = 0xc3,
    ProgramId = 0xb5,
    ProgramChecksum = 0xc4,
    FunctionName = 0xb6,
    NestedCallCount = 0xba,
    InputCount = 0xb7,
    InputTypes = 0xb9,
    InputValues = 0xb8,
    Tvk = 0xbf,
    Tpk = 0xc0,
    GammasCount = 0xc1,
    Gammas = 0xc2,
  }

  impl TryFrom<u16> for TlvTag {
    type Error = AppError;
    fn try_from(value: u16) -> Result<Self, Self::Error> {
      match value {
        0x01 => Ok(TlvTag::StructureType),
        0x02 => Ok(TlvTag::Version),
        0x15 => Ok(TlvTag::Signature),
        0xb0 => Ok(TlvTag::MaxBaseFee),
        0xb1 => Ok(TlvTag::MaxPriorityFee),
        0xb2 => Ok(TlvTag::FeeFunctionName),
        0xb3 => Ok(TlvTag::FeeProgramId),
        0xb4 => Ok(TlvTag::Request),
        0xc3 => Ok(TlvTag::NetworkId),
        0xb5 => Ok(TlvTag::ProgramId),
        0xc4 => Ok(TlvTag::ProgramChecksum),
        0xb6 => Ok(TlvTag::FunctionName),
        0xba => Ok(TlvTag::NestedCallCount),
        0xb7 => Ok(TlvTag::InputCount),
        0xb9 => Ok(TlvTag::InputTypes),
        0xb8 => Ok(TlvTag::InputValues),
        0xbf => Ok(TlvTag::Tvk),
        0xc0 => Ok(TlvTag::Tpk),
        0xc1 => Ok(TlvTag::GammasCount),
        0xc2 => Ok(TlvTag::Gammas),
        _ => Err(AppError::BadRequest(format!(
          "Unknown TLV tag: 0x{:02x}",
          value
        ))),
      }
    }
  }

  impl From<TlvTag> for Vec<u8> {
    fn from(tag: TlvTag) -> Self {
      let mut out = Vec::new();
      let tag_val = tag as u16;
      if tag_val <= 127 {
        out.push(tag_val as u8);
      } else if tag_val <= 255 {
        out.push(TAG_VALUE_PREFIX_LOW);
        out.push(tag_val as u8);
      } else {
        out.push(TAG_VALUE_PREFIX_HIGH);
        out.extend_from_slice(&tag_val.to_be_bytes());
      }
      out
    }
  }

  #[derive(Debug, Clone, Copy, PartialEq, Eq)]
  #[repr(u8)]
  pub enum LiteralType {
    Address = 0x00,
    Boolean = 0x01,
    Field = 0x02,
    Group = 0x03,
    I8 = 0x04,
    I16 = 0x05,
    I32 = 0x06,
    I64 = 0x07,
    I128 = 0x08,
    U8 = 0x09,
    U16 = 0x0a,
    U32 = 0x0b,
    U64 = 0x0c,
    U128 = 0x0d,
    Scalar = 0x0e,
    Signature = 0x0f,
    String = 0x10,
  }

  impl LiteralType {
    pub fn to_byte(self) -> u8 {
      self as u8
    }
  }

  impl FromStr for LiteralType {
    type Err = AppError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
      match s.to_lowercase().as_str() {
        "address" => Ok(LiteralType::Address),
        "boolean" => Ok(LiteralType::Boolean),
        "field" => Ok(LiteralType::Field),
        "group" => Ok(LiteralType::Group),
        "i8" => Ok(LiteralType::I8),
        "i16" => Ok(LiteralType::I16),
        "i32" => Ok(LiteralType::I32),
        "i64" => Ok(LiteralType::I64),
        "i128" => Ok(LiteralType::I128),
        "u8" => Ok(LiteralType::U8),
        "u16" => Ok(LiteralType::U16),
        "u32" => Ok(LiteralType::U32),
        "u64" => Ok(LiteralType::U64),
        "u128" => Ok(LiteralType::U128),
        "scalar" => Ok(LiteralType::Scalar),
        "signature" => Ok(LiteralType::Signature),
        "string" => Ok(LiteralType::String),
        _ => Err(AppError::BadRequest(format!("Invalid literal type: {}", s))),
      }
    }
  }

  struct SignatureDecodingContext<N: Network> {
    signature_opt: Option<(Signature<N>, ComputeKey<N>)>,
    tvk_opt: Option<Field<N>>,
    tpk_opt: Option<Group<N>>,
    gammas: Vec<Group<N>>,
    expected_gammas_count: Option<u8>,
  }

  impl<N: Network> SignatureDecodingContext<N> {
    fn new() -> Self {
      Self {
        signature_opt: None,
        tvk_opt: None,
        tpk_opt: None,
        gammas: Vec::new(),
        expected_gammas_count: None,
      }
    }

    fn process_tag(&mut self, tag: TlvTag, value: &[u8]) -> AppResult<()> {
      match tag {
        TlvTag::Signature => {
          self.signature_opt = Some(decode_signature_field::<N>(value)?);
        }
        TlvTag::Tvk => {
          self.tvk_opt = Some(decode_field_le::<Field<N>>(value, "tvk")?);
        }
        TlvTag::Tpk => {
          self.tpk_opt = Some(decode_field_le::<Group<N>>(value, "tpk")?);
        }
        TlvTag::GammasCount => {
          //DA encodes the count always on single byte
          if value.len() != 1 {
            return Err(AppError::BadRequest(format!(
              "Invalid GammasCount length: expected 1, got {}",
              value.len()
            )));
          }
          self.expected_gammas_count = Some(value[0]);
        }
        TlvTag::Gammas => {
          let chunks = value.chunks_exact(GAMMA_VALUE_LENGTH);
          if !chunks.remainder().is_empty() {
            return Err(AppError::BadRequest(format!(
              "Invalid Gammas length: expected a multiple of 32 bytes, got {}",
              value.len()
            )));
          }

          for chunk in chunks {
            self
              .gammas
              .push(decode_field_le::<Group<N>>(chunk, "gamma")?);
          }
        }
        _ => {}
      }
      Ok(())
    }

    fn into_result(self) -> AppResult<(RequestSignature<N>, ComputeKey<N>)> {
      let (signature, compute_key) = self
        .signature_opt
        .ok_or_else(|| AppError::BadRequest("Missing signature field (0x15) in TLV".to_string()))?;
      let tvk = self
        .tvk_opt
        .ok_or_else(|| AppError::BadRequest("Missing tvk field (0xbf) in TLV".to_string()))?;
      let tpk = self
        .tpk_opt
        .ok_or_else(|| AppError::BadRequest("Missing tpk field (0xc0) in TLV".to_string()))?;

      if let Some(expected_count) = self.expected_gammas_count
        && self.gammas.len() != expected_count as usize
      {
        return Err(AppError::BadRequest(format!(
          "Gamma count mismatch: expected {}, got {}",
          expected_count,
          self.gammas.len()
        )));
      }

      Ok((
        RequestSignature {
          signature,
          tvk,
          tpk,
          gammas: self.gammas,
          nested_calls: Vec::new(),
        },
        compute_key,
      ))
    }
  }

  fn decode_field_le<T: FromBytes>(value: &[u8], field_name: &str) -> AppResult<T> {
    T::from_bytes_le(value)
      .map_err(|e| AppError::BadRequest(format!("Invalid {}: {}", field_name, e)))
  }

  fn decode_signature_field<N: Network>(value: &[u8]) -> AppResult<(Signature<N>, ComputeKey<N>)> {
    if value.len() != 128 {
      return Err(AppError::BadRequest(format!(
        "Invalid signature length: expected 128, got {}",
        value.len()
      )));
    }
    let challenge = Scalar::<N>::from_bytes_le(&value[0..32])
      .map_err(|e| AppError::BadRequest(format!("Invalid challenge: {}", e)))?;
    let response = Scalar::<N>::from_bytes_le(&value[32..64])
      .map_err(|e| AppError::BadRequest(format!("Invalid response: {}", e)))?;

    let compute_key = ComputeKey::from_bytes_le(&value[64..128])
      .map_err(|e| AppError::BadRequest(format!("Invalid compute key: {}", e)))?;

    let signature = Signature::from((challenge, response, compute_key));
    Ok((signature, compute_key))
  }

  fn validate_header(bytes: &[u8], offset: &mut usize) -> AppResult<()> {
    let (tag, value, next_offset) = decode_tlv(bytes, *offset)?;
    if tag != TlvTag::StructureType as u16 || value != [0x2a] {
      return Err(AppError::BadRequest(format!(
        "Invalid structure type for signature: expected 0x2a, got {:?}",
        value
      )));
    }
    *offset = next_offset;

    let (tag, value, next_offset) = decode_tlv(bytes, *offset)?;
    if tag != TlvTag::Version as u16 || value != VERSION.as_bytes() {
      return Err(AppError::BadRequest(format!(
        "Invalid version: expected {:?}, got {:?}",
        VERSION.as_bytes(),
        value
      )));
    }
    *offset = next_offset;
    Ok(())
  }

  pub fn decode_signature_tlv<N: Network>(
    hex_data: &str,
  ) -> AppResult<(RequestSignature<N>, ComputeKey<N>)> {
    let bytes = decode_hex(hex_data)?;
    let mut offset: usize = 0;

    validate_header(&bytes, &mut offset)?;

    let mut context = SignatureDecodingContext::new();
    while offset < bytes.len() {
      let (tag_raw, value, next_offset) = decode_tlv(&bytes, offset)?;
      let tag = TlvTag::try_from(tag_raw)?;
      context.process_tag(tag, value)?;
      offset = next_offset;
    }

    context.into_result()
  }

  fn read_var_int(bytes: &[u8], offset: &mut usize, field_name: &str) -> AppResult<u16> {
    if *offset >= bytes.len() {
      return Err(AppError::BadRequest(format!(
        "Unexpected end of TLV data while reading {}",
        field_name
      )));
    }

    let first_byte = bytes[*offset];
    *offset += 1;

    if first_byte == TAG_VALUE_PREFIX_LOW {
      if *offset >= bytes.len() {
        return Err(AppError::BadRequest(format!(
          "Unexpected end of TLV data while reading {}",
          field_name
        )));
      }
      let val = bytes[*offset] as u16;
      *offset += 1;
      Ok(val)
    } else if first_byte == TAG_VALUE_PREFIX_HIGH {
      if *offset + 1 >= bytes.len() {
        return Err(AppError::BadRequest(format!(
          "Unexpected end of TLV data while reading {}",
          field_name
        )));
      }
      let val = u16::from_be_bytes([bytes[*offset], bytes[*offset + 1]]);
      *offset += 2;
      Ok(val)
    } else {
      Ok(first_byte as u16)
    }
  }

  pub fn decode_tlv(bytes: &[u8], mut offset: usize) -> AppResult<(u16, &[u8], usize)> {
    let tag = read_var_int(bytes, &mut offset, "tag")?;
    let len = read_var_int(bytes, &mut offset, "length")? as usize;

    if offset + len > bytes.len() {
      return Err(AppError::BadRequest(format!(
        "TLV value length exceeds data size: tag={:x}, len={}, remaining={}",
        tag,
        len,
        bytes.len() - offset
      )));
    }

    let value = &bytes[offset..offset + len];
    Ok((tag, value, offset + len))
  }

  pub fn request_to_tlv<N: Network>(
    request: &PreparedRequest<N>,
    fee_limits: Option<FeeLimits>,
    commitments: Vec<Field<N>>,
  ) -> AppResult<String> {
    let tlv_request_bytes = encode_request_tlv(request, commitments.as_ref())?;
    let function_name = request.function_name.to_string();

    match (fee_limits, function_name.as_str(), request.is_root) {
      (None, "fee_public" | "fee_private", _) => {
        // For fee intents we do not want to wrap the request in a root "wrapper"
        // No other fee option available in the aleo network, no point in making this dynamic
        Ok(encode_hex(&tlv_request_bytes))
      }
      (Some(fee_limits), _, true) => {
        // Having any root intent requires a fee limit
        let base_fee: u32 = parse_string(&fee_limits.max_base_fee)?;
        let priority_fee: u32 = parse_string(&fee_limits.max_priority_fee)?;

        let tlv_root_bytes = encode_root_tlv(
          base_fee,
          priority_fee,
          fee_limits.function_name.as_str(),
          crate::core::intent::CREDITS_PROGRAM,
          &tlv_request_bytes,
        );

        Ok(encode_hex(&tlv_root_bytes))
      }
      (None, _, false) => {
        // For any nested call we do not care about the fee limits, we just want to build basic request object
        Ok(encode_hex(&tlv_request_bytes))
      }
      _ => Err(AppError::BadRequest("Invalid request".into())), // Any other combination is invalid
    }
  }

  fn encode_length(len: usize) -> Vec<u8> {
    let mut out = Vec::new();
    if len <= 127 {
      out.push(len as u8);
    } else if len <= 255 {
      out.push(TAG_VALUE_PREFIX_LOW);
      out.push(len as u8);
    } else {
      out.push(TAG_VALUE_PREFIX_HIGH);
      out.extend_from_slice(&(len as u16).to_be_bytes());
    }
    out
  }

  pub fn get_tlv(tag: TlvTag, value: &[u8]) -> Vec<u8> {
    let mut out: Vec<u8> = tag.into();
    out.extend(encode_length(value.len()));
    out.extend_from_slice(value);
    out
  }

  pub fn get_literal_type_byte(literal_type: &str) -> Option<u8> {
    literal_type
      .parse::<LiteralType>()
      .ok()
      .map(|lt| lt.to_byte())
  }

  pub fn get_plaintext_type_bytes(plaintext_type: &str) -> Vec<u8> {
    if let Some(byte) = get_literal_type_byte(plaintext_type) {
      vec![0x00, byte]
    } else {
      let mut out = vec![0x01];
      out.push(plaintext_type.len() as u8);
      out.extend_from_slice(plaintext_type.as_bytes());
      out
    }
  }

  pub fn get_input_type_bytes<N: Network>(input_type: &ValueType<N>) -> Vec<u8> {
    match input_type {
      ValueType::Constant(plaintext_type) => {
        let mut out = vec![0x00];
        out.extend_from_slice(&get_plaintext_type_bytes(&plaintext_type.to_string()));
        out
      }
      ValueType::Public(plaintext_type) => {
        let mut out = vec![0x01];
        out.extend_from_slice(&get_plaintext_type_bytes(&plaintext_type.to_string()));
        out
      }
      ValueType::Private(plaintext_type) => {
        let mut out = vec![0x02];
        out.extend_from_slice(&get_plaintext_type_bytes(&plaintext_type.to_string()));
        out
      }
      ValueType::Record(identifier) => {
        let mut out = vec![0x03];
        let id_str = identifier.to_string();
        out.push(id_str.len() as u8);
        out.extend_from_slice(id_str.as_bytes());
        out
      }
      ValueType::ExternalRecord(_) => vec![0x04],
      _ => {
        // Should not happen with current supported intent types
        warn!("Unknown type {:?}", input_type);
        Vec::new()
      }
    }
  }

  fn network_id_to_bytes(network_id: u16) -> Vec<u8> {
    if network_id == 0 {
      vec![0x00, 0x00] // Mainnet
    } else {
      vec![0x00, 0x01] // Testnet
    }
  }

  fn encode_input_value<N: Network>(
    input: &Value<N>,
    input_type: &ValueType<N>,
    commitment: Option<&Field<N>>,
  ) -> AppResult<Vec<u8>> {
    match input {
      Value::Plaintext(Plaintext::Literal(Literal::Address(addr), _)) => addr
        .to_bytes_le()
        .map_err(|e| AppError::BadRequest(format!("Failed to serialize address: {}", e))),
      Value::Plaintext(Plaintext::Literal(lit, _)) => {
        let bytes = lit
          .to_bytes_le()
          .map_err(|e| AppError::BadRequest(format!("Failed to serialize literal: {}", e)))?;
        // Converting the Literal type, we need to cut off the first 2 bytes as they encode the literal type
        Ok(bytes[LITERAL_TYPE_LENGTH..].to_vec())
      }
      Value::Record(record) if matches!(input_type, ValueType::ExternalRecord(_)) => {
        let fields = record.to_fields().map_err(|e| {
          AppError::BadRequest(format!("Failed to convert record to fields: {}", e))
        })?;
        let mut bytes = Vec::with_capacity(fields.len() * 32);
        for f in &fields {
          bytes.extend_from_slice(
            &f.to_bytes_le()
              .map_err(|e| AppError::BadRequest(format!("Failed to serialize field: {}", e)))?,
          );
        }
        Ok(bytes)
      }
      Value::Record(_) => {
        let commitment =
          commitment.ok_or_else(|| AppError::BadRequest("commitment missing".to_string()))?;

        let h_generator = compute_h_generator(commitment)?;
        Ok(
          [
            commitment.to_bytes_le()?,
            h_generator.to_x_coordinate().to_bytes_le()?,
            h_generator.to_y_coordinate().to_bytes_le()?,
          ]
          .concat(),
        )
      }
      // Non-literal plaintext (struct/array, e.g. [MerkleProof; 2]) -> flat field
      // array, each field as 32-byte LE. This matches the device's struct/array hash
      // path (app-aleo plaintext_to_field), which chops the value into 32-byte fields
      // and hashes them directly. Literals are handled above and must keep their raw
      // encoding (the device hashes those via bits_from_plaintext_literal instead).
      Value::Plaintext(pt @ (Plaintext::Struct(..) | Plaintext::Array(..))) => {
        let fields = pt.to_fields().map_err(|e| {
          AppError::BadRequest(format!("Failed to convert plaintext to fields: {}", e))
        })?;
        let mut bytes = Vec::with_capacity(fields.len() * 32);
        for f in &fields {
          bytes.extend_from_slice(
            &f.to_bytes_le()
              .map_err(|e| AppError::BadRequest(format!("Failed to serialize field: {}", e)))?,
          );
        }
        Ok(bytes)
      }
      _ => Ok(
        input
          .to_bytes_le()
          .map_err(|e| AppError::BadRequest(format!("Failed to serialize input: {}", e)))?,
      ),
    }
  }

  pub fn encode_request_tlv<N: Network>(
    request: &PreparedRequest<N>,
    commitments: &[Field<N>],
  ) -> AppResult<Vec<u8>> {
    let mut val = Vec::new();

    // Structure type (0x29 for request)
    val.extend_from_slice(&get_tlv(TlvTag::StructureType, &[0x29]));

    val.extend_from_slice(&get_tlv(TlvTag::Version, VERSION.as_bytes().as_ref()));

    let net_bytes = network_id_to_bytes(request.network_id);
    val.extend_from_slice(&get_tlv(TlvTag::NetworkId, &net_bytes));

    val.extend_from_slice(&get_tlv(
      TlvTag::ProgramId,
      request.program_id.to_string().as_bytes(),
    ));

    val.extend_from_slice(&get_tlv(
      TlvTag::FunctionName,
      request.function_name.to_string().as_bytes(),
    ));

    val.extend_from_slice(&get_tlv(TlvTag::InputCount, &[request.inputs.len() as u8]));

    // Input values & types
    let mut commitment_offset = 0usize;
    for (input, input_type) in request.inputs.iter().zip(request.input_types.iter()) {
      val.extend_from_slice(&get_tlv(
        TlvTag::InputTypes,
        &get_input_type_bytes(input_type),
      ));

      let commitment = if matches!(input_type, ValueType::Record(_)) {
        let c = commitments.get(commitment_offset);
        commitment_offset += 1;
        c
      } else {
        None
      };

      let input_val = encode_input_value(input, input_type, commitment)?;
      val.extend_from_slice(&get_tlv(TlvTag::InputValues, &input_val));
    }

    // Nested call count
    if request.is_root {
      val.extend_from_slice(&get_tlv(
        TlvTag::NestedCallCount,
        &[request.nested_calls.len() as u8],
      ));
    }

    if let Some(cs) = &request.program_checksum {
      info!("Program checksum: {:?} {:?}", cs, &request.program_id);
      let bytes = cs.to_bytes_le().map_err(|e| {
        AppError::BadRequest(format!("Failed to serialize program_checksum: {}", e))
      })?;
      val.extend_from_slice(&get_tlv(TlvTag::ProgramChecksum, &bytes));
    }

    Ok(val)
  }

  pub fn encode_root_tlv(
    max_base_fee: u32,
    max_priority_fee: u32,
    fee_function_name: &str,
    fee_program_id: &str,
    request_tlv: &[u8],
  ) -> Vec<u8> {
    let mut req = Vec::new();
    // Structure type (0x28 for root)
    req.extend_from_slice(&get_tlv(TlvTag::StructureType, &[0x28]));
    req.extend_from_slice(&get_tlv(TlvTag::Version, VERSION.as_bytes().as_ref()));
    req.extend_from_slice(&get_tlv(TlvTag::MaxBaseFee, &max_base_fee.to_be_bytes()));
    req.extend_from_slice(&get_tlv(
      TlvTag::MaxPriorityFee,
      &max_priority_fee.to_be_bytes(),
    ));
    req.extend_from_slice(&get_tlv(
      TlvTag::FeeFunctionName,
      fee_function_name.as_bytes(),
    ));
    req.extend_from_slice(&get_tlv(TlvTag::FeeProgramId, fee_program_id.as_bytes()));
    req.extend_from_slice(&get_tlv(TlvTag::Request, request_tlv));

    req
  }

  #[cfg(test)]
  mod tests {
    use super::*;

    #[test]
    fn test_decode_fees_intent_signature() {
      // tlv encoded data generated by the device app
      let hex_data = "01012a020101158064dfe2bfa8b940b3ebe90c37d748d6438c48d90ef96147c3843d5d0cf2844c026c77f059ad389f461ccaacdacdf864745856b8d447f3031a30ed224ba9268a02be32cb6352137ec6c1a5c859671920b6ceefef1926f865e66ad8f28ddcd2dc0530efcd6246287fce5a52ec8fe8ff53b528af9eb8f2d97dd501b780a64a9bd40581bf20201916702676d30083667183bfb3d19b1648e8c213ce0158e7961dd424b5e70881c020c57640d0c3afe76de3bca678715b00b28b8433fd7eb9469bd43336dfdd123d0f81c10100";

      let result = decode_signature_tlv::<TestnetV0>(hex_data);
      assert!(
        result.is_ok(),
        "Failed to decode signature: {:?}",
        result.err()
      );

      let (sig_data, compute_key) = result.unwrap();

      // tvk, tpk and signature cannot be hardcoded as they are not deterministic
      assert_eq!(sig_data.gammas.len(), 0);
      assert_eq!(sig_data.nested_calls.len(), 0);

      // DA 0.0.3 returns the compute key in the response for the fees intent too.
      assert_eq!(
        hex::encode(compute_key.to_bytes_le().unwrap()),
        "be32cb6352137ec6c1a5c859671920b6ceefef1926f865e66ad8f28ddcd2dc0530efcd6246287fce5a52ec8fe8ff53b528af9eb8f2d97dd501b780a64a9bd405"
      );
    }

    #[test]
    fn test_decode_signature_tlv_gamma_mismatch() {
      let mut hex_data = "01012a020101".to_string();
      hex_data.push_str("158180");
      hex_data.push_str(&"00".repeat(128));
      hex_data.push_str("bf20");
      hex_data.push_str(&"00".repeat(32));
      hex_data.push_str("c020");
      hex_data.push_str(&"00".repeat(32));
      hex_data.push_str("c10101");

      let result = decode_signature_tlv::<TestnetV0>(&hex_data);
      assert!(result.is_err());
      if let Err(AppError::BadRequest(msg)) = result {
        assert!(msg.contains("Gamma count mismatch"));
        assert!(msg.contains("expected 1, got 0"));
      } else {
        panic!("Expected Gamma count mismatch error");
      }
    }

    #[test]
    fn test_decode_root_intent_signature() {
      // tlv encoded data generated by the device app
      let hex_data = "01012a02010115803e1f51d3d5c9cb9b17815aa97d33fd489e70296f4d3c993dbc6b7c64662550010eeba2e758655604f4c49dbd7ddafc59e288b3c7a60b0a2b3bd8e83c330f4004be32cb6352137ec6c1a5c859671920b6ceefef1926f865e66ad8f28ddcd2dc0530efcd6246287fce5a52ec8fe8ff53b528af9eb8f2d97dd501b780a64a9bd40581bf20014ce460cdf02d7a6bbbd1964dd25c188f112c92c99d152cd443e3c7b1bb101181c02070a48de49e7f858c87ced7be88bb533ec3c518cb5f363a0a45f615e18ed0be1181c10100";

      let result = decode_signature_tlv::<TestnetV0>(hex_data);
      assert!(
        result.is_ok(),
        "Failed to decode signature: {:?}",
        result.err()
      );

      let (sig_data, compute_key) = result.unwrap();

      assert_eq!(sig_data.gammas.len(), 0);
      assert_eq!(sig_data.nested_calls.len(), 0);
      assert_eq!(
        hex::encode(compute_key.to_bytes_le().unwrap()),
        "be32cb6352137ec6c1a5c859671920b6ceefef1926f865e66ad8f28ddcd2dc0530efcd6246287fce5a52ec8fe8ff53b528af9eb8f2d97dd501b780a64a9bd405"
      );
    }

    #[test]
    fn test_get_tlv_basic() {
      let tag = TlvTag::StructureType;
      let value = vec![0x29];
      let tlv = get_tlv(tag, &value);
      assert_eq!(tlv, vec![0x01, 0x01, 0x29]);
    }

    #[test]
    fn test_address() {
      let address_literal: Literal<MainnetV0> = Literal::Address(
        Address::from_str("aleo1sfydt6z6cnqjx3hcgk9ajw03ecj6uqlfcm9u3p3gdhckzcc2w5xqv3v3pe")
          .unwrap(),
      );

      //Address literal to bytes should contain 0x00, 0x00 as the first two bytes (literal type encoding)
      let address_bytes = address_literal.to_bytes_le().unwrap();
      assert_eq!(address_bytes[0], 0x00);
      assert_eq!(address_bytes[1], 0x00);
    }

    #[test]
    fn test_get_tlv_length_boundaries() {
      let tag = TlvTag::Version;

      // 1-byte length: 127
      let value_127 = vec![0u8; 127];
      let tlv_127 = get_tlv(tag, &value_127);
      assert_eq!(tlv_127[1], 127); // Tag(0x02), Length(127)
      assert_eq!(tlv_127.len(), 2 + 127);

      // 2-byte length: 128 (0x80) -> 0x81, 0x80
      let value_128 = vec![0u8; 128];
      let tlv_128 = get_tlv(tag, &value_128);
      assert_eq!(tlv_128[1], 0x81);
      assert_eq!(tlv_128[2], 128);
      assert_eq!(tlv_128.len(), 3 + 128);

      // 2-byte length: 255 -> 0x81, 0xff
      let value_255 = vec![0u8; 255];
      let tlv_255 = get_tlv(tag, &value_255);
      assert_eq!(tlv_255[1], 0x81);
      assert_eq!(tlv_255[2], 255);
      assert_eq!(tlv_255.len(), 3 + 255);

      // 3-byte length: 256 -> 0x82, 0x01, 0x00
      let value_256 = vec![0u8; 256];
      let tlv_256 = get_tlv(tag, &value_256);
      assert_eq!(tlv_256[1], 0x82);
      assert_eq!(tlv_256[2], 0x01);
      assert_eq!(tlv_256[3], 0x00);
      assert_eq!(tlv_256.len(), 4 + 256);
    }

    #[test]
    fn test_get_tlv_empty_value() {
      let tag = TlvTag::Request;
      let value = vec![];
      let tlv = get_tlv(tag, &value);
      // Tag 0xb4 (180) -> 0x81, 0xb4
      // Length 0 -> 0x00
      assert_eq!(tlv, vec![0x81, 0xb4, 0x00]);
    }

    #[test]
    fn test_u64() {
      let u64_literal: Literal<MainnetV0> = Literal::U64(U64::new(1000));

      //U64 number literal to bytes should contain 0x0c, 0x00 as the first two bytes (literal type encoding)
      let u64_bytes = u64_literal.to_bytes_le().unwrap();
      assert_eq!(u64_bytes[0], 0x0c);
      assert_eq!(u64_bytes[1], 0x00);
    }

    #[test]
    fn test_get_tlv_long_tag() {
      let tag = TlvTag::NetworkId; // 0xc3 = 195
      let value = vec![0x00, 0x01];
      let tlv = get_tlv(tag, &value);
      // Tag 0xc3 > 127, so it should be 0x81, 0xc3
      assert_eq!(tlv, vec![0x81, 0xc3, 0x02, 0x00, 0x01]);
    }

    #[test]
    fn test_get_literal_type_byte() {
      assert_eq!(get_literal_type_byte("address"), Some(0x00));
      assert_eq!(get_literal_type_byte("u64"), Some(0x0c));
      assert_eq!(get_literal_type_byte("unknown"), None);
    }

    #[test]
    fn test_literal_type_invalid_str() {
      let result = LiteralType::from_str("not_a_type");
      assert!(result.is_err());
      if let Err(AppError::BadRequest(msg)) = result {
        assert!(msg.contains("Invalid literal type"));
      } else {
        panic!("Expected AppError::BadRequest");
      }
    }

    #[test]
    fn test_encode_merkle_proof_input_is_flat_field_array() {
      // A production-shape [MerkleProof; 2] literal: 2 structs, each 16-field siblings.
      let siblings = std::iter::repeat_n("0field", 16)
        .collect::<Vec<_>>()
        .join(", ");
      let proof_str = format!(
        "[{{siblings: [{siblings}], leaf_index: 0u32}}, {{siblings: [{siblings}], leaf_index: 1u32}}]"
      );

      let value = Value::<TestnetV0>::from_str(&proof_str).unwrap();
      let fields = match &value {
        Value::Plaintext(pt) => pt.to_fields().unwrap(),
        _ => panic!("expected plaintext"),
      };

      assert_eq!(fields.len(), 41, "[MerkleProof; 2] field count changed");

      let input_type = ValueType::<TestnetV0>::from_str("[MerkleProof; 2u32].private").unwrap();
      let bytes = encode_input_value(&value, &input_type, None).unwrap();

      // Device requires value_length % 32 == 0 and reads each 32-byte chunk as a field.
      assert_eq!(bytes.len() % 32, 0, "encoded proof must be 32-byte aligned");
      assert_eq!(
        bytes.len(),
        fields.len() * 32,
        "encoded proof must equal to_fields() serialized as 32-byte LE, not to_bytes_le()"
      );
    }

    // program_checksum encoding tests

    /// Scan encoded TLV bytes for the first occurrence of `target_tag`, return its value.
    fn find_tag_value(bytes: &[u8], target_tag: u16) -> Option<Vec<u8>> {
      let mut offset = 0;
      while offset < bytes.len() {
        match decode_tlv(bytes, offset) {
          Ok((tag, value, next)) => {
            if tag == target_tag {
              return Some(value.to_vec());
            }
            offset = next;
          }
          Err(_) => break,
        }
      }
      None
    }

    fn make_root_request<N: Network>() -> PreparedRequest<N> {
      PreparedRequest::new(
        1u16,
        ProgramID::from_str("credits.aleo").unwrap(),
        Identifier::from_str("transfer_public").unwrap(),
        vec![],
        vec![],
      )
    }

    #[test]
    fn test_program_checksum_absent_when_none() {
      let request = make_root_request::<TestnetV0>();
      let encoded = encode_request_tlv(&request, &[]).unwrap();
      assert!(
        find_tag_value(&encoded, TlvTag::ProgramChecksum as u16).is_none(),
        "ProgramChecksum tag must not appear when program_checksum is None"
      );
    }

    #[test]
    fn test_program_checksum_present_and_matches_field() {
      let mut field_bytes = [0u8; 32];
      field_bytes[0] = 7;
      let cs = Field::<TestnetV0>::from_bytes_le(&field_bytes).unwrap();
      let expected = cs.to_bytes_le().unwrap();

      let request = make_root_request::<TestnetV0>().with_program_checksum(cs);
      let encoded = encode_request_tlv(&request, &[]).unwrap();

      let found = find_tag_value(&encoded, TlvTag::ProgramChecksum as u16)
        .expect("ProgramChecksum tag missing from encoded TLV");
      assert_eq!(
        found, expected,
        "ProgramChecksum value does not match field bytes"
      );
    }
  }
}
