import credits.aleo;

program ldg_p2p_910.aleo;

function transfer_private_to_public_9:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as credits.aleo/credits.record;
    input r7 as credits.aleo/credits.record;
    input r8 as credits.aleo/credits.record;
    input r9 as u64.public;
    call credits.aleo/join r0 r1 into r10;
    call credits.aleo/join r2 r10 into r11;
    call credits.aleo/join r3 r11 into r12;
    call credits.aleo/join r4 r12 into r13;
    call credits.aleo/join r5 r13 into r14;
    call credits.aleo/join r6 r14 into r15;
    call credits.aleo/join r7 r15 into r16;
    call credits.aleo/join r8 r16 into r17;
    call credits.aleo/transfer_private_to_public r17 self.signer r9 into r18 r19;
    async transfer_private_to_public_9 r19 into r20;
    output r18 as credits.aleo/credits.record;
    output r20 as ldg_p2p_910.aleo/transfer_private_to_public_9.future;

finalize transfer_private_to_public_9:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_10:
    input r0 as credits.aleo/credits.record;
    input r1 as credits.aleo/credits.record;
    input r2 as credits.aleo/credits.record;
    input r3 as credits.aleo/credits.record;
    input r4 as credits.aleo/credits.record;
    input r5 as credits.aleo/credits.record;
    input r6 as credits.aleo/credits.record;
    input r7 as credits.aleo/credits.record;
    input r8 as credits.aleo/credits.record;
    input r9 as credits.aleo/credits.record;
    input r10 as u64.public;
    call credits.aleo/join r0 r1 into r11;
    call credits.aleo/join r2 r11 into r12;
    call credits.aleo/join r3 r12 into r13;
    call credits.aleo/join r4 r13 into r14;
    call credits.aleo/join r5 r14 into r15;
    call credits.aleo/join r6 r15 into r16;
    call credits.aleo/join r7 r16 into r17;
    call credits.aleo/join r8 r17 into r18;
    call credits.aleo/join r9 r18 into r19;
    call credits.aleo/transfer_private_to_public r19 self.signer r10 into r20 r21;
    async transfer_private_to_public_10 r21 into r22;
    output r20 as credits.aleo/credits.record;
    output r22 as ldg_p2p_910.aleo/transfer_private_to_public_10.future;

finalize transfer_private_to_public_10:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

constructor:
    assert.eq edition 0u16;
