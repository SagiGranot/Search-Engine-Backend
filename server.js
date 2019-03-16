const indexFile = require('./indexFile')
const express   = require('express')
const fs =  require('fs')
const multer = require('multer');
const cors = require('cors');
const TEMP_DIR = './tmp'
const SRC_DIR = './src'

var index = new indexFile
index.extractWords()
index.buildIndex()

const app  = express()
const port = process.env.PORT || 8080



app.use(express.static('tmp'))

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
    cb(null, './tmp/')
    },
    filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
    }
    });
const upload = multer({ storage })
     
app.use(cors());
app.post('/upload', upload.single('image'), (req, res) => {
    if (req.file){
        index.updateIndex()
        res.json({
        imageUrl: `uploads/${req.file.filename}`
        });
    }
    else 
    res.status("409").json("No Files to Upload.");
});


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
    //Clear '"' characters
    seder.forEach((word,i) => {
        seder[i]=word.replace(new RegExp('"', 'g'), "")
        console.log(word)
    })
    //opNot contains: all documents which are to be ignored
    //opAnd contains: the only documents to be displayed
    let opNot = []
    let opAnd = []
    seder.forEach((term, i) => {
        if (term.indexOf('-') > -1){
            seder[i] = term.replace('-','')
            let obj = index.map.get(seder[i])
            if (obj){
                obj.locations.forEach(location => {
                    opNot.push(location.id)
                })
            }
            else{
                console.error("The term '"+seder[i]+"' is not in the index")
            }
        }
    })
    for(let i=0; i<opNot.length; ++i) {
        for(let j=i+1; j<opNot.length; ++j) {
            if(opNot[i] === opNot[j])
                opNot.splice(j--, 1);
        }
    }
    seder.forEach((term, i) => {
        if (term.indexOf('+') > -1){
            seder[i] = term.replace('+','')
            let obj = index.map.get(seder[i])
            if (obj){
                obj.locations.forEach(location => {
                    opAnd.push(location.id)
                })
            }
            else{
                console.error("The term '"+seder[i]+"' is not in the index")
            }
        }
    })
    for(let i=0; i<opAnd.length; ++i) {
        for(let j=i+1; j<opAnd.length; ++j) {
            if(opAnd[i] === opAnd[j])
                opAnd.splice(j--, 1);
        }
    }
    console.log(opAnd)
    console.log(opNot)
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
    //Clean results from not operator
    opNot.forEach(doc => {
        results.forEach((result, i) => {
            if (result.id === doc){
                results.splice(i,1)
                console.log(doc + ' was miscluded!')
            }
        })
    })
    //Apply the and operator
    if(opAnd.length > 0){
        results.forEach((result,i) => {
            let counter = 0
            opAnd.forEach(doc => {
                if (result.id !== doc){
                    counter++
                }
            })
            if ((counter === opAnd.length)&&(counter>0)){
                console.log(results[i].id + ' was miscluded!')
                results.splice(i,1)
            }

        })
    }
    //Sort results by weight
    results.sort((a,b) => {
        if(a.weight > b.weight)
            return -1
        if(a.weight < b.weight)
            return 1
        else return 0
    })
    //console.log(results)
    opAnd = []
    opNot = []
    res.json(results)

})

app.get('/view/:id/:query',(req,res) => {
    const { id = null, query = null } = req.params
    let data = fs.readFileSync(SRC_DIR+'/'+id, 'utf-8')
    let temp = query.toString().toLowerCase()
    let seder = temp.match(/[a-zA-Z]+/g)
    seder.forEach(term => {
        data = data.replace(new RegExp(term, 'g'), "<b><u>"+term+"</b></u>")
    })
    let j = {body: data}
    res.json(j)
})



 app.listen(port,
    () => console.log(`listening on port ${port}`));