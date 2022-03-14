import 'dotenv/config';
import path from 'path';
import {
  createMixture,
} from '../helpers/accounts';
import { PublicKey } from '@solana/web3.js';
import fs from 'fs';
import { BN, Program, web3 } from '@project-serum/anchor';
import { loadCache, saveCache } from '../helpers/cache';
import { arweaveUpload } from '../helpers/upload/arweave';

export async function uploadArweave({
  metadata, 
  cacheName,
  env,
  walletKeyPair,
  mixtureProgram,
  mintIndex//재료 nft들의 이름을 계산해서 부모 nft image 이름 
}: {
  metadata: any;
  cacheName: string;
  env: string;
  walletKeyPair: web3.Keypair;
  mixtureProgram: Program;
  mintIndex: number;
}):Promise<{ 
  status: string; 
  arweaveLink: string; 
  mixture: string; }> 
  {
  const savedContent = loadCache(cacheName, env);
  const cacheContent:any = savedContent || {};

  if (!cacheContent.items) {
    cacheContent.items = {};
  }
  let mixturePDA;
  let metadataJSON = metadata;
  const result = await UploadData(
    metadata, 
    mintIndex, 
    walletKeyPair,
    mixtureProgram,
    env,
    ) // metadata json, 
  console.log("UploadData result : ", result);
  if (result.status === "success"){
    console.log(`initializing mixture machine`);
    try {
      const res = await createMixture( // 부모 nft 주소를 넘겨서 seed로 써야함.
        mixtureProgram,
        walletKeyPair,
        { 
          itemsAvailable: new BN(1),
          symbol: "BNB",
          sellerFeeBasisPoints: 100,
          isMutable: false,
          retainAuthority: false,
          gatekeeper: null,
          goLiveDate: null,
          price: new BN(0),
          endSettings: null,
          whitelistMintSettings: null,
          hiddenSettings: null,
          uuid : null,

          name: metadataJSON.name,
          uri: result.link,
          maxSupply: new BN(0),
          creators: metadataJSON.properties.creators.map((creator:{address:string, share:number}) => {
            return {
              address: new PublicKey(creator.address),
              verified: true,
              share: creator.share,
            };
          }),
        },);
        if (!res.txId){
          console.log("tx id does not exist");
          return {
            status: "fail", 
            arweaveLink: '',
            mixture:  ''
          };
        }
        //
        mixturePDA = res.mixtureMachine.toBase58();
        let mixture = res.mixtureMachine;
        console.log(
          `initialized config for a mixtureMachine with publickey: ${mixturePDA}`,
        );
        cacheContent.items[mintIndex] = {
          uuid : res.uuid, 
          mixture: mixturePDA,
          link : result.link,
          name: metadataJSON.name,
          onChain: true,
        };      
        saveCache(cacheName, env, cacheContent);
        return {
          status: "success", 
          arweaveLink: result.link,
          mixture:  mixturePDA
        };
    }
    catch(err){
      console.log("Throw an error when createMixture: ", err);
      return {
        status: "fail", 
        arweaveLink: '',
        mixture:  ''
      };
    }
  }
  else{
    return {
      status: "fail", 
      arweaveLink: '',
      mixture:  ''
    }
  } 
}

async function UploadData(
  metadata:any,
  mint_index:number,
  walletKeyPair:web3.Keypair,
  mixtureProgram:Program,
  env:string,
) : Promise<{
  link: string;
  imageLink: string;
  status: string;
}>{
  const manifest = metadata;
  const imagePath = path.join(process.env.ASSETS, `${mint_index}.png`);
  if (fs.existsSync(imagePath)) {
    manifest.image = `${mint_index}.png`;
  }
  else{
    return {
      link : '',
      imageLink: '',
      status : "fail"
    };
  }
  console.log("manifest.image: ", manifest.image);
  const manifestBuffer = Buffer.from(JSON.stringify(manifest));
  // TODO : 당장은 확장자는 png로만 사용.
  let link, imageLink;
  try {
        [link, imageLink] = await arweaveUpload(
          walletKeyPair,
          mixtureProgram,
          env,
          imagePath,
          manifestBuffer,
          manifest,
          mint_index, //합성 NFT 파일명
        );
        return {
          link: link,
          imageLink: imageLink,
          status: "success"
        }
  } catch (err) {
    console.log("arweave Upload err: ", err);
      return {
        link: '',
        imageLink: '',
        status: "fail"
      }
  }
}

/**
 * The Cache object, represented in its minimal form.
 */
type Cache = {
  program: {
    config?: string;
  };
  items: {
    [key: string]: any;
  };
};