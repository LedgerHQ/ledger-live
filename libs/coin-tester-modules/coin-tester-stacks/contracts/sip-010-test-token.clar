;; sip-010-test-token
;;
;; Minimal SIP-010-compliant fungible token, deployed when the devnet boots for this package's token
;; send/send-max scenario transactions. A fresh Clarinet devnet has no
;; fungible token deployed at all (unlike VeChain's VTHO or NEAR's staking-pool WASM, which
;; pre-exist on their respective test networks), so the token scenario block has nothing to send
;; unless this package deploys one itself.

(define-fungible-token test-token)

(define-constant err-not-token-owner (err u101))

(define-data-var token-name (string-ascii 32) "Coin Tester Token")
(define-data-var token-symbol (string-ascii 10) "CTT")
(define-data-var token-uri (optional (string-utf8 256)) none)

;; Minted once at deploy time, straight to the send scenario's two senders (100 CTT each, 6
;; decimals): wallet_4 (legacy strategy) and wallet_5 (generic-adapter strategy), see `src/fixtures.ts`.
;; Minting here rather than transferring from the deployer during the test is deliberate: Clarinet
;; signs its whole deployment plan up front with pre-assigned deployer nonces, and a deployer
;; transaction sent before the epoch-4.0 batch (`signer-manager-stub`) takes that batch's nonce, so
;; the stub is silently never deployed.
(try! (ft-mint? test-token u100000000 'ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND))
(try! (ft-mint? test-token u100000000 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB))

(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    (asserts! (is-eq tx-sender sender) err-not-token-owner)
    (try! (ft-transfer? test-token amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

(define-read-only (get-name)
  (ok (var-get token-name))
)

(define-read-only (get-symbol)
  (ok (var-get token-symbol))
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance test-token account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply test-token))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)
