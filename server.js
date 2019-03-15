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
    //Build results array
    let results = []
    seder.forEach(term => {
        let obj = index.map.get(term)
        console.log(obj)
        if (obj){
        let w = obj.weight
        obj.locations.forEach(location => {
            let x = 0 
            //Check if this location already exists in the results array
            results.forEach(result => {
                if(result.id === location.id){
                    //if it does, add this obj weight to the relevant result.
                    result.weight += w
                    return
                }
                else{
                    x++
                }
            })
            //The next statement is true if results array doesn't contain this object location
            if (x === results.length){
                //Add location to results
                let temp = location.id.replace(/\D/g,'')
                let summaryIndex = Number(temp) - 1000

                results.push({id: location.id,weight: w,summary:index.summaries[summaryIndex]})
            }
            
        })
        }
    })
    //Sort results by weight
    results.sort((a,b) => {
        if(a.weight > b.weight)
            return -1
        if(a.weight < b.weight)
            return 1
        else return 0
    })
    console.log(results)
    res.json(results)

})

 app.listen(port,
    () => console.log(`listening on port ${port}`));