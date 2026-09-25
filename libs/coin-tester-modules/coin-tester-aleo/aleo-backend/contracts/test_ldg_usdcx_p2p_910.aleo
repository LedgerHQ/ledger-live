import merkle_tree.aleo;
import test_usdcx_multisig_core.aleo;
import test_usdcx_freezelist.aleo;
import test_usdcx_stablecoin.aleo;

program ldg_usdcx_p2p_910.aleo;

function transfer_private_to_public_9:
    input r0 as test_usdcx_stablecoin.aleo/Token.record;
    input r1 as test_usdcx_stablecoin.aleo/Token.record;
    input r2 as test_usdcx_stablecoin.aleo/Token.record;
    input r3 as test_usdcx_stablecoin.aleo/Token.record;
    input r4 as test_usdcx_stablecoin.aleo/Token.record;
    input r5 as test_usdcx_stablecoin.aleo/Token.record;
    input r6 as test_usdcx_stablecoin.aleo/Token.record;
    input r7 as test_usdcx_stablecoin.aleo/Token.record;
    input r8 as test_usdcx_stablecoin.aleo/Token.record;
    input r9 as address.public;
    input r10 as u128.public;
    input r11 as [test_usdcx_stablecoin.aleo/MerkleProof; 2u32].private;
    call test_usdcx_stablecoin.aleo/join r0 r1 into r12;
    call test_usdcx_stablecoin.aleo/join r2 r12 into r13;
    call test_usdcx_stablecoin.aleo/join r3 r13 into r14;
    call test_usdcx_stablecoin.aleo/join r4 r14 into r15;
    call test_usdcx_stablecoin.aleo/join r5 r15 into r16;
    call test_usdcx_stablecoin.aleo/join r6 r16 into r17;
    call test_usdcx_stablecoin.aleo/join r7 r17 into r18;
    call test_usdcx_stablecoin.aleo/join r8 r18 into r19;
    call test_usdcx_stablecoin.aleo/transfer_private_to_public r9 r10 r19 r11 into r20 r21 r22;
    async transfer_private_to_public_9 r22 into r23;
    output r20 as test_usdcx_stablecoin.aleo/ComplianceRecord.record;
    output r21 as test_usdcx_stablecoin.aleo/Token.record;
    output r23 as ldg_usdcx_p2p_910.aleo/transfer_private_to_public_9.future;

finalize transfer_private_to_public_9:
    input r0 as test_usdcx_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_10:
    input r0 as test_usdcx_stablecoin.aleo/Token.record;
    input r1 as test_usdcx_stablecoin.aleo/Token.record;
    input r2 as test_usdcx_stablecoin.aleo/Token.record;
    input r3 as test_usdcx_stablecoin.aleo/Token.record;
    input r4 as test_usdcx_stablecoin.aleo/Token.record;
    input r5 as test_usdcx_stablecoin.aleo/Token.record;
    input r6 as test_usdcx_stablecoin.aleo/Token.record;
    input r7 as test_usdcx_stablecoin.aleo/Token.record;
    input r8 as test_usdcx_stablecoin.aleo/Token.record;
    input r9 as test_usdcx_stablecoin.aleo/Token.record;
    input r10 as address.public;
    input r11 as u128.public;
    input r12 as [test_usdcx_stablecoin.aleo/MerkleProof; 2u32].private;
    call test_usdcx_stablecoin.aleo/join r0 r1 into r13;
    call test_usdcx_stablecoin.aleo/join r2 r13 into r14;
    call test_usdcx_stablecoin.aleo/join r3 r14 into r15;
    call test_usdcx_stablecoin.aleo/join r4 r15 into r16;
    call test_usdcx_stablecoin.aleo/join r5 r16 into r17;
    call test_usdcx_stablecoin.aleo/join r6 r17 into r18;
    call test_usdcx_stablecoin.aleo/join r7 r18 into r19;
    call test_usdcx_stablecoin.aleo/join r8 r19 into r20;
    call test_usdcx_stablecoin.aleo/join r9 r20 into r21;
    call test_usdcx_stablecoin.aleo/transfer_private_to_public r10 r11 r21 r12 into r22 r23 r24;
    async transfer_private_to_public_10 r24 into r25;
    output r22 as test_usdcx_stablecoin.aleo/ComplianceRecord.record;
    output r23 as test_usdcx_stablecoin.aleo/Token.record;
    output r25 as ldg_usdcx_p2p_910.aleo/transfer_private_to_public_10.future;

finalize transfer_private_to_public_10:
    input r0 as test_usdcx_stablecoin.aleo/transfer_private_to_public.future;
    await r0;

constructor:
    assert.eq edition 0u16;
