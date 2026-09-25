import merkle_tree.aleo;
import usad_multisig_core.aleo;
import usad_freezelist.aleo;
import usad_stablecoin.aleo;
program ldg_usad_p_910.aleo;

function transfer_private_9:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as usad_stablecoin.aleo/Token.record;
    input r8 as usad_stablecoin.aleo/Token.record;
    input r9 as address.private;
    input r10 as u128.private;
    input r11 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r12;
    call usad_stablecoin.aleo/join r2 r12 into r13;
    call usad_stablecoin.aleo/join r3 r13 into r14;
    call usad_stablecoin.aleo/join r4 r14 into r15;
    call usad_stablecoin.aleo/join r5 r15 into r16;
    call usad_stablecoin.aleo/join r6 r16 into r17;
    call usad_stablecoin.aleo/join r7 r17 into r18;
    call usad_stablecoin.aleo/join r8 r18 into r19;
    call usad_stablecoin.aleo/transfer_private r9 r10 r19 r11 into r20 r21 r22 r23;
    async transfer_private_9 r23 into r24;
    output r20 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r21 as usad_stablecoin.aleo/Token.record;
    output r22 as usad_stablecoin.aleo/Token.record;
    output r24 as ldg_usad_p_910.aleo/transfer_private_9.future;

finalize transfer_private_9:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

function transfer_private_10:
    input r0 as usad_stablecoin.aleo/Token.record;
    input r1 as usad_stablecoin.aleo/Token.record;
    input r2 as usad_stablecoin.aleo/Token.record;
    input r3 as usad_stablecoin.aleo/Token.record;
    input r4 as usad_stablecoin.aleo/Token.record;
    input r5 as usad_stablecoin.aleo/Token.record;
    input r6 as usad_stablecoin.aleo/Token.record;
    input r7 as usad_stablecoin.aleo/Token.record;
    input r8 as usad_stablecoin.aleo/Token.record;
    input r9 as usad_stablecoin.aleo/Token.record;
    input r10 as address.private;
    input r11 as u128.private;
    input r12 as [usad_stablecoin.aleo/MerkleProof; 2u32].private;
    call usad_stablecoin.aleo/join r0 r1 into r13;
    call usad_stablecoin.aleo/join r2 r13 into r14;
    call usad_stablecoin.aleo/join r3 r14 into r15;
    call usad_stablecoin.aleo/join r4 r15 into r16;
    call usad_stablecoin.aleo/join r5 r16 into r17;
    call usad_stablecoin.aleo/join r6 r17 into r18;
    call usad_stablecoin.aleo/join r7 r18 into r19;
    call usad_stablecoin.aleo/join r8 r19 into r20;
    call usad_stablecoin.aleo/join r9 r20 into r21;
    call usad_stablecoin.aleo/transfer_private r10 r11 r21 r12 into r22 r23 r24 r25;
    async transfer_private_10 r25 into r26;
    output r22 as usad_stablecoin.aleo/ComplianceRecord.record;
    output r23 as usad_stablecoin.aleo/Token.record;
    output r24 as usad_stablecoin.aleo/Token.record;
    output r26 as ldg_usad_p_910.aleo/transfer_private_10.future;

finalize transfer_private_10:
    input r0 as usad_stablecoin.aleo/transfer_private.future;
    await r0;

constructor:
    assert.eq edition 0u16;
