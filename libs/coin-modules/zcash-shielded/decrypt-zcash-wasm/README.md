# Decrypt Zcash transaction - Client-Side Memo Decryption

WebAssembly module for decrypting Zcash shielded transaction memos.

## 🚀 Building

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack
```

### Build for Web

```bash
# Development build
wasm-pack build --target nodejs --dev

# Production build (optimized for size)
wasm-pack build --target nodejs --release
```

This will generate files in `pkg/`.
