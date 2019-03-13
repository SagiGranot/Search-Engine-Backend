const indexFile = require('./indexFile')
const express   = require('express')

var index = new indexFile
index.extractWords()
index.buildIndex()

const app  = express()
const port = process.env.PORT || 8080

app.set('port',port);
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.set("Content-Type", "application/json");
        next();
 });

app.get('/search/:query',(req,res) => {
    const { query = null } = req.params
    const stopList = ["the", "a", "is", "to", "in", "at"]
    let temp = query.toString().toLowerCase()
    let seder = temp.match(/[a-zA-Z()+-/"]+/g)
    //Remove StopList words from query
    for(let i=0; i<seder.length; i++){
        stopList.forEach(word => {
            if(seder[i]===word){
                seder.splice(i,1)
                i--
                return
            }
        })
    }
    //
    console.log(seder)
    seder.forEach(term => {
        let obj = index.map.get(term)
        console.log(obj)
    })
    
    res.send('OK')

})

 app.listen(port,
    () => console.log(`listening on port ${port}`));