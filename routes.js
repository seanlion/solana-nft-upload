//Endpoint : /upload (POST)
//parameter : config.json, assets, network(default : devnet)
const shortid = require('short-id')
import { candyMachineUpload } from './candy-machine-v2';

function routes(app, db, _id, assets){
    // _id는 파일 절대경로.
    let music = db.collection('music-store')

    // 업로드할 nft json, network을 json으로 받자.
    app.post('/upload', (req,res)=>{
        let metadata = req.body.metadata // json을 받아야 함.
        let network = req.body.network // string
        if(metadata && network){
            // 컨트랙트 인스턴스가 인터페이스 호출
            candyMachineUpload(assets, _id, metadata, network)
            // 리턴값 받아서 처리
            .then((result)=>{
                music.insertOne({result})
                res.json({
                    "status":result.status, 
                    "content": result.content})
            })
            .catch(err=>{
                res.status(500).json({"status":"Failed", "reason":"Upload error occured"})
            })
        }else{
            res.status(400).json({"status":"Failed", "reason":"wrong input"})
        }
    })
}
module.exports = routes
