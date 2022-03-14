import {
    PublicKey,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
    TransactionInstruction,
  } from '@solana/web3.js';
  import {
    SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    TOKEN_METADATA_PROGRAM_ID,
    CONFIG_ARRAY_START_V2,
    CANDY_MACHINE_PROGRAM_V2_ID, // TODO : 변경 예정
    CONFIG_LINE_SIZE_V2,
  } from './constants';
  import * as anchor from '@project-serum/anchor';
  import { MixtureData } from './accounts';
import { Program } from '@project-serum/anchor';
  
 
  export function createMetadataInstruction(
    metadataAccount: PublicKey,
    mint: PublicKey,
    mintAuthority: PublicKey,
    payer: PublicKey,
    updateAuthority: PublicKey,
    txnData: Buffer,
  ) {
    const keys = [
      {
        pubkey: metadataAccount,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: mint,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: mintAuthority,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: payer,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: updateAuthority,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      {
        pubkey: SYSVAR_RENT_PUBKEY,
        isSigner: false,
        isWritable: false,
      },
    ];
    return new TransactionInstruction({
      keys,
      programId: TOKEN_METADATA_PROGRAM_ID,
      data: txnData,
    });
  }
    
  export async function createMixtureAccount(
    anchorProgram: Program,
    mixtureData: MixtureData,
    payerWallet: PublicKey,
    mixtureAccount: any,
  ) {
    const size =
    CONFIG_ARRAY_START_V2 +
    4 +
    mixtureData.itemsAvailable.toNumber() * CONFIG_LINE_SIZE_V2 +
    8 +
    2 * (Math.floor(mixtureData.itemsAvailable.toNumber() / 8) + 1);

  return anchor.web3.SystemProgram.createAccount({
    fromPubkey: payerWallet,
    newAccountPubkey: mixtureAccount,
    space: size,
    lamports:
      await anchorProgram.provider.connection.getMinimumBalanceForRentExemption(
        size,
      ),
    programId: CANDY_MACHINE_PROGRAM_V2_ID,
  });

    // program 배포 되면 밑에 있는 코드를 써야 함. 대신 size구하는건 위에거 적절히 쓰는게 좋을수도..
    // const size =
    //   CONFIG_ARRAY_START_V2 + // 커스텀 필요
    //   4 +
    //   CONFIG_LINE_SIZE_V2 +
    //   8 +
    //   2 * (Math.floor(1 / 8) + 1);
  
    // return anchor.web3.SystemProgram.createAccount({
    //   fromPubkey: payerWallet,
    //   newAccountPubkey: mixtureAccount,
    //   space: size,
    //   lamports:
    //     await anchorProgram.provider.connection.getMinimumBalanceForRentExemption(
    //       size,
    //     ),
    //   programId: CANDY_MACHINE_PROGRAM_V2_ID, //TODO: mixture program ID 들어가야 함.
    // });
  }
  