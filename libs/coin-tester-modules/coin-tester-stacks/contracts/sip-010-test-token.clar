;; sip-010-test-token
;;
;; Minimal SIP-010-compliant fungible token, deployed at devnet genesis for this package's token
;; send/send-max scenario transactions. A fresh Clarinet devnet starts from genesis with no
;; fungible token deployed at all (unlike VeChain's VTHO or NEAR's staking-pool WASM, which
;; pre-exist on their respective test networks), so the token scenario block has nothing to send
;; unless this package deploys one itself.

(define-fungible-token test-token)

(define-constant contract-owner tx-sender)
(define-constant err-not-token-owner (err u101))

(define-data-var token-name (string-ascii 32) "Coin Tester Token")
(define-data-var token-symbol (string-ascii 10) "CTT")
(define-data-var token-uri (optional (string-utf8 256)) none)

;; Minted once at deploy time so the scenario's funder account has a balance to send from.
(try! (ft-mint? test-token u1000000000000 contract-owner))

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
