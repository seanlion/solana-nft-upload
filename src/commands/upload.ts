import 'dotenv/config';
import { readFile } from 'fs/promises';
import path from 'path';
import log from 'loglevel';
import {
  createMixtureV2,
  loadCandyProgram,
  loadWalletKey,
} from '../helpers/accounts';
import { PublicKey } from '@solana/web3.js';
import fs from 'fs';
import { BN, Program, web3 } from '@project-serum/anchor';
import { uuidFromConfigPubkey } from '../helpers/accounts';

import { loadCache, saveCache } from '../helpers/cache';
import { arweaveUpload } from '../helpers/upload/arweave';
import { makeArweaveBundleUploadGenerator } from '../helpers/upload/arweave-bundle';
import { awsUpload } from '../helpers/upload/aws';
import { ipfsCreds, ipfsUpload } from '../helpers/upload/ipfs';

import { StorageType } from '../helpers/storage-type';
import { AssetKey } from '.././types';
import { chunks } from '../helpers/various';
import { nftStorageUpload } from '../helpers/upload/nft-storage';

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
}): Promise<object> {
  const savedContent = loadCache(cacheName, env);
  const cacheContent:any = savedContent || {};

  if (!cacheContent.items) {
    cacheContent.items = {};
  }
   let mixturePDA;
  console.log("metadata: ", typeof(metadata))
  // 변경하는 버전은 이미 특정 메타데이터를 들고 있으니 Manifest은 받은 json이어야 한다.
  // let metadataJSON = JSON.parse(metadata);
  let metadataJSON = metadata;
  const result = await UploadData(
    metadata, 
    mintIndex, 
    walletKeyPair,
    mixtureProgram,
    env,
    ) // metadata json, 
  if (result.status === "success"){
    console.log(`initializing candy machine`);
    // arweave upload 한 다으메 createMixture로 name과 uri가 올라가면 cache json의 onChain을 true로 바꿔서 업데이트 해야 함.
    try {
      const res = await createMixtureV2(
        mixtureProgram,
        walletKeyPair,
        { 
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
        //cacheContent.program.candyMachine = res.candyMachine.toBase58();
        mixturePDA = res.candyMachine.toBase58();
        let mixture = res.candyMachine;
        console.log(
          `initialized config for a candy machine with publickey: ${mixturePDA}`,
        );
        cacheContent.items[mintIndex] = {
          uuid : res.uuid, 
          mixture: mixturePDA,
          link : result.link,
          name: metadataJSON.name,
          onChain: true,
        };      
        // saveCache할 때 처음 json 만들고 나서는 item에만 추가해야 함. onChain true로 업데이트
        saveCache(cacheName, env, cacheContent);
        return {
          status: "success", 
          arweaveLink: result.link,
          mixture:  mixturePDA
        };
    }
    catch(err){
      console.log("Throw an error when createMixture");
      return {
        status: "fail", 
        arweaveLink: null,
        mixture:  null
      };
    }
  }
  else{
    return {
      status: "fail", 
      content: null,
      mixture:  null
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
  // 이미 metadata json(manifest)는 받았기 때문에 받은거 쓰면 됨.
  // const manifest = JSON.parse(metadata);
  const manifest = metadata;
  const imagePath = path.join(process.env.ASSETS as string, `${mint_index}.png`);
  // assets 폴더에서 mint_index 이름을 가진 png 파일이 있는지 찾아서 쓴다.
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
  const manifestBuffer = Buffer.from(JSON.stringify(manifest));
  //const fileNameIndex = manifest.image.substring(0, manifest.image.length - 4) // 예를 들어 0.png. 확장자는 png로만 가정함.
  let link, imageLink;
  try {
        [link, imageLink] = await arweaveUpload(
          walletKeyPair,
          mixtureProgram,
          env,
          manifest.image,
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

/**
 * The Manifest object for a given asset.
 * This object holds the contents of the asset's JSON file.
 * Represented here in its minimal form.
 */
type Manifest = {
  image: string;
  animation_url: string;
  name: string;
  symbol: string;
  seller_fee_basis_points: number;
  properties: {
    metadata: Array<{ type: string; uri: string }>;
    creators: Array<{
      address: string;
      share: number;
    }>;
  };
};


/**
 * Returns a Manifest from a path and an assetKey
 * Replaces image.ext => index.ext
 * Replaces animation_url.ext => index.ext
 */
// 파일에 대한 메타데이터 객체 가지고 오기
function getAssetManifest(dirname: string, assetKey: string): Manifest {
  // assetKey가 0.json이면 0만 가지고 오게 함
  const assetIndex = assetKey.includes('.json')
    ? assetKey.substring(0, assetKey.length - 5)
    : assetKey;
  const manifestPath = path.join(dirname, `${assetIndex}.json`);
  const manifest: Manifest = JSON.parse(
    fs.readFileSync(manifestPath).toString(),
  );
  manifest.image = manifest.image.replace('image', assetIndex);
  if ('animation_url' in manifest) {
    manifest.animation_url = manifest.animation_url.replace(
      'animation_url',
      assetIndex,
    );
  }
  return manifest;
}

/**
 * Update the Cache object for assets that were uploaded with their matching
 * Manifest link. Also set the `onChain` property to `false` so we know this
 * asset should later be appended to the deployed Candy Machine program's
 * configuration on chain.
 */
function updateCacheAfterUpload(
  cache: Cache,
  cacheKeys: Array<keyof Cache['items']>,
  links: string[],
  manifests: Manifest[],
) {
  cacheKeys.forEach((cacheKey, idx) => {
    cache.items[cacheKey] = {
      link: links[idx],
      name: manifests[idx].name,
      onChain: false,
    };
  });
}

type UploadParams = {
  metadata: string[];
  cacheName: string;
  env: string;
  keypair: string;
  storage: string;
  rpcUrl: string;
  ipfsCredentials: ipfsCreds;
  awsS3Bucket: string;
  arweaveJwk: string;
  batchSize: number;
};