;; Minimal `signer-manager-trait` implementation so the coin-tester's staking scenario has a real,
;; deployed contract to target as pox-5's `stake`/`unstake` "signer manager" argument. pox-5 is a
;; separate, literally-named contract (`ST000000000000000000002AMW42H.pox-5`), NOT an alias `.pox`
;; ever resolves to -- `.pox` stays the pre-pox-5 contract forever, confirmed both by
;; `stx-labs/clarinet`'s own devnet-automation reference stub (`chains_coordinator.rs`'s
;; `POX5_SIGNER_MANAGER_SOURCE`, itself copied from stacks-core's `pox5_signer_manager_source()`)
;; and by mainnet's live `/v2/pox` (`contract_id: "SP...002Q6VF78.pox-5"`). This stub mirrors that
;; reference's shape (`validate-stake!` + `checkpoint-staker`, both required by pox-5's real
;; `signer-manager-trait`) rather than reinventing it.
;;
;; `grant-signer-key`/`register-signer` on pox-5 both require `contract-caller` to equal the signer
;; manager's own principal (see pox-5's `ERR_UNAUTHORIZED_SIGNER_REGISTRATION` checks), which only
;; holds when this contract itself is the direct caller -- hence the two `relay-*` wrappers below,
;; called from the test setup on this contract rather than on pox-5 directly.
(impl-trait 'ST000000000000000000002AMW42H.pox-5.signer-manager-trait)
(use-trait signer-manager-trait 'ST000000000000000000002AMW42H.pox-5.signer-manager-trait)

(define-public (validate-stake!
    (staker principal)
    (first-index uint)
    (num-indexes uint)
    (amount-ustx uint)
    (amount-sats uint)
    (is-bond bool)
    (signer-calldata (optional (buff 500)))
  )
  (ok true)
)

(define-public (checkpoint-staker
    (staker principal)
    (first-index uint)
    (num-indexes uint)
    (is-bond bool)
  )
  (ok true)
)

(define-public (relay-grant-signer-key
    (signer-key (buff 33))
    (auth-id uint)
    (signer-sig (buff 65))
  )
  ;; `as-contract? () ... current-contract`, not the older `as-contract tx-sender` idiom: the
  ;; latter made this contract's real deploy fail with `err deploy ... [(err none)]` on this
  ;; devnet's Clarity version (epoch 4.0), verified empirically -- `as-contract?`/`current-contract`
  ;; is exactly the pattern `stx-labs/clarinet`'s own reference (`chains_coordinator.rs`'s
  ;; `POX5_SIGNER_MANAGER_SOURCE`) uses for the equivalent call.
  (as-contract? ()
    (try! (contract-call? 'ST000000000000000000002AMW42H.pox-5 grant-signer-key
      signer-key current-contract auth-id signer-sig
    ))
  )
)

;; `signer-manager` is a caller-supplied trait argument (a `contractPrincipalCV` in the calling
;; transaction, `signerManager.ts`), not a literal `.signer-manager-stub` self-reference inside this
;; source -- a literal self-reference here makes Clarinet's deployment-plan generator see this
;; contract as depending on itself and reject it with `CircularReference(["signer-manager-stub"])`
;; (verified empirically). The caller always supplies this contract's own principal in practice, so
;; the effect is identical; only where the reference lives differs.
(define-public (relay-register-signer
    (signer-manager <signer-manager-trait>)
    (signer-key (buff 33))
  )
  (contract-call? 'ST000000000000000000002AMW42H.pox-5 register-signer
    signer-manager signer-key
  )
)
