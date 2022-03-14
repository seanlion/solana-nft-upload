import {ComposableNFTUpload} from "./mixture-machine";

export function routesFunc(app, _id){
    app.post('/upload', (req,res)=>{
        let metadata = req.body.metadata // json을 받아야 함.
        let network = req.body.network // string
        let composableNFTIndex = req.body.composableNFTIndex
        if(metadata && network){
            ComposableNFTUpload(
                metadata, 
                _id, 
                network,
                composableNFTIndex
                )
            .then((result)=>{
                res.json({
                    "status":result.status, 
                    "arweaveLink": result.arweaveLink,
                    "mixture": result.mixture
                })
            })
            .catch(err=>{
                console.log("err : ", err);
                res.status(500).json(
                    {"status":"fail", "reason":"Upload error occured", "err": err}
                    )
            })
        }else{
            res.status(400).json({"status":"fail", "reason":"wrong input"})
        }
    })
}
