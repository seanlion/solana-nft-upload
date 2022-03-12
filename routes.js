//Endpoint : /upload (POST)
//parameter : config.json, assets, network(default : devnet)
const shortid = require('short-id')
import { candyMachineUpload } from './candy-machine-v2';

function routes(app, db, _id){
    // _id는 파일 절대경로.
    let music = db.collection('music-store')

    app.post('/upload', (req,res)=>{
        let metadata = req.body.metadata // json을 받아야 함.
        let network = req.body.network // string
        let composableNFTIndex = req.body.composableNFTIndex
        if(metadata && network){
            // 컨트랙트 인스턴스가 인터페이스 호출
            candyMachineUpload(
                metadata, 
                _id, 
                network,
                composableNFTIndex
                )
            // 리턴값 받아서 처리
            .then((result)=>{
                music.insertOne({result})
                res.json({
                    "status":result.status, 
                    "arweaveLink": result.arweaveLink,
                    "mixture": result.mixture
                })
            })
            .catch(err=>{
                res.status(500).json(
                    {"status":"fail", "reason":"Upload error occured"}
                    )
            })
        }else{
            res.status(400).json({"status":"fail", "reason":"wrong input"})
        }
    })
}
module.exports = routes
