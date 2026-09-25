import credits.aleo;

program ldg_p2p_1114.aleo;

function transfer_private_to_public_11:
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
    input r10 as credits.aleo/credits.record;
    input r11 as u64.public;
    call credits.aleo/join r0 r1 into r12;
    call credits.aleo/join r2 r12 into r13;
    call credits.aleo/join r3 r13 into r14;
    call credits.aleo/join r4 r14 into r15;
    call credits.aleo/join r5 r15 into r16;
    call credits.aleo/join r6 r16 into r17;
    call credits.aleo/join r7 r17 into r18;
    call credits.aleo/join r8 r18 into r19;
    call credits.aleo/join r9 r19 into r20;
    call credits.aleo/join r10 r20 into r21;
    call credits.aleo/transfer_private_to_public r21 self.signer r11 into r22 r23;
    async transfer_private_to_public_11 r23 into r24;
    output r22 as credits.aleo/credits.record;
    output r24 as ldg_p2p_1114.aleo/transfer_private_to_public_11.future;

finalize transfer_private_to_public_11:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_12:
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
    input r10 as credits.aleo/credits.record;
    input r11 as credits.aleo/credits.record;
    input r12 as u64.public;
    call credits.aleo/join r0 r1 into r13;
    call credits.aleo/join r2 r13 into r14;
    call credits.aleo/join r3 r14 into r15;
    call credits.aleo/join r4 r15 into r16;
    call credits.aleo/join r5 r16 into r17;
    call credits.aleo/join r6 r17 into r18;
    call credits.aleo/join r7 r18 into r19;
    call credits.aleo/join r8 r19 into r20;
    call credits.aleo/join r9 r20 into r21;
    call credits.aleo/join r10 r21 into r22;
    call credits.aleo/join r11 r22 into r23;
    call credits.aleo/transfer_private_to_public r23 self.signer r12 into r24 r25;
    async transfer_private_to_public_12 r25 into r26;
    output r24 as credits.aleo/credits.record;
    output r26 as ldg_p2p_1114.aleo/transfer_private_to_public_12.future;

finalize transfer_private_to_public_12:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_13:
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
    input r10 as credits.aleo/credits.record;
    input r11 as credits.aleo/credits.record;
    input r12 as credits.aleo/credits.record;
    input r13 as u64.public;
    call credits.aleo/join r0 r1 into r14;
    call credits.aleo/join r2 r14 into r15;
    call credits.aleo/join r3 r15 into r16;
    call credits.aleo/join r4 r16 into r17;
    call credits.aleo/join r5 r17 into r18;
    call credits.aleo/join r6 r18 into r19;
    call credits.aleo/join r7 r19 into r20;
    call credits.aleo/join r8 r20 into r21;
    call credits.aleo/join r9 r21 into r22;
    call credits.aleo/join r10 r22 into r23;
    call credits.aleo/join r11 r23 into r24;
    call credits.aleo/join r12 r24 into r25;
    call credits.aleo/transfer_private_to_public r25 self.signer r13 into r26 r27;
    async transfer_private_to_public_13 r27 into r28;
    output r26 as credits.aleo/credits.record;
    output r28 as ldg_p2p_1114.aleo/transfer_private_to_public_13.future;

finalize transfer_private_to_public_13:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

function transfer_private_to_public_14:
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
    input r10 as credits.aleo/credits.record;
    input r11 as credits.aleo/credits.record;
    input r12 as credits.aleo/credits.record;
    input r13 as credits.aleo/credits.record;
    input r14 as u64.public;
    call credits.aleo/join r0 r1 into r15;
    call credits.aleo/join r2 r15 into r16;
    call credits.aleo/join r3 r16 into r17;
    call credits.aleo/join r4 r17 into r18;
    call credits.aleo/join r5 r18 into r19;
    call credits.aleo/join r6 r19 into r20;
    call credits.aleo/join r7 r20 into r21;
    call credits.aleo/join r8 r21 into r22;
    call credits.aleo/join r9 r22 into r23;
    call credits.aleo/join r10 r23 into r24;
    call credits.aleo/join r11 r24 into r25;
    call credits.aleo/join r12 r25 into r26;
    call credits.aleo/join r13 r26 into r27;
    call credits.aleo/transfer_private_to_public r27 self.signer r14 into r28 r29;
    async transfer_private_to_public_14 r29 into r30;
    output r28 as credits.aleo/credits.record;
    output r30 as ldg_p2p_1114.aleo/transfer_private_to_public_14.future;

finalize transfer_private_to_public_14:
    input r0 as credits.aleo/transfer_private_to_public.future;
    await r0;

constructor:
    assert.eq edition 0u16;
