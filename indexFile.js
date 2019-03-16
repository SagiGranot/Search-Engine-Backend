const fs =  require('fs')
const hashmap = require('hashmap')
const TEMP_DIR = './tmp'
const SRC_DIR = './src'


module.exports = class indexFile{
    constructor(){
        this.map = new hashmap()
        this.words = [];
        this.summaries = [];
        this.docID = 1000;
    }
    extractWords(){
        this.words = []
        //Read tmp directory to get new documents
        let data = fs.readdirSync(TEMP_DIR)
        data.forEach(file => {
            //Read a document
            let parsed = fs.readFileSync(TEMP_DIR+'/'+file, 'utf-8')
            this.summaries.push(parsed.replace(/\r?\n|\r/g," ").substring(0,150).trim()+"...")
            //Move document into src directory
            fs.rename(TEMP_DIR+'/'+file, SRC_DIR+'/'+(this.docID)+'.txt', (err)=> {
                if(err) throw err
                console.log("File: "+file+" moved to /src")
            })
            //Format data and keep only words.
            parsed = parsed.toString().toLowerCase()
            let seder = parsed.match(/[a-zA-Z]+/g)
            //Build words array
            seder.forEach(sed => {
                this.words.push({term: sed, id: this.docID+'.txt', tf:1, _tf: 0})
            });  
            this.docID++;
        })
        //Proccess words array and remove duplicates
        this.words.sort((a,b) => {
            if(a.term < b.term)
                return -1
            if(a.term > b.term)
                return 1
            else return 0
        })
        for(let i=0; i<this.words.length-1; i++)
        {
            let j = i + 1
            while(this.words[i].term === this.words[j].term)
            {
                if(this.words[i].id === this.words[j].id){
                    this.words.splice(j,1)
                    this.words[i].tf++
                }
                else j++ 
            }
            this.words[i]._tf = 1+Math.log(this.words[i].tf)
        }
        
    }
    buildIndex(){
        //Use words array from extractWords() to build hashmap index
        //Words array is sorted alphabetically
        //
        //Index holds data for each word -> how many documents has it, and an array with the location id, tf etc.
        let counter = 1
        for(let i=0; i<this.words.length; i++)
        {
            let j = i + 1
            let y = i
            counter = 1
            let array = []
            if (j < this.words.length-1){
                while(this.words[i].term === this.words[j++].term){
                    //This while loop eliminates word duplicates
                    //all duplicated words are converted into one object
                    //this object has (per word)  - #of docs and locations array
                counter++ 
                array.push({id: this.words[y].id, tf: this.words[y].tf, disabled: false})
                y++
                }
            }
            array.push({id: this.words[y].id, tf: this.words[y].tf, disabled: false})
            let N = this.docID - 1000
            let Weight =  this.words[i]._tf * (Math.log(N/counter)) // (_tf * idf)
            this.map.set(this.words[i].term, {weight: Weight, docs: counter, locations:array})
            if (counter > 1)
                i += counter -1    
        }
        this.words = []
    }
    updateIndex(){
        this.extractWords()
        for(let i=0; i<this.words.length; i++){
           let obj = this.map.get(this.words[i].term)
           if(obj){
                obj.docs++
                obj.locations.push({id: this.words[i].id, tf: this.words[i].tf, disabled: false})
           } 
           else{
                let N = this.docID - 1000
                let Weight =  this.words[i]._tf * (Math.log(N/1)) // (_tf * idf)
                this.map.set(this.words[i].term, {weight: Weight,docs: 1, locations: [{id: this.words[i].id, tf: this.words[i].tf}]})
           }
        }
    }

}
