const fs =  require('fs')
const hashmap = require('hashmap')
const TEMP_DIR = './tmp'
const SRC_DIR = './src'


module.exports = class indexFile{
    constructor(){
        this.map = new hashmap()
        this.words = [];
        this.docID = 1000;
    }
    extractWords(){
        let data = fs.readdirSync(TEMP_DIR)
        data.forEach(file => {
            let parsed = fs.readFileSync(TEMP_DIR+'/'+file, 'utf-8')
            fs.rename(TEMP_DIR+'/'+file, SRC_DIR+'/'+(this.docID)+'.txt', (err)=> {
                if(err) throw err
                console.log("File: "+file+" moved to /src")
            })
            parsed = parsed.toString().toLowerCase()
            let seder = parsed.match(/[a-zA-Z]+/g)
            seder.forEach(sed => {
                this.words.push({term: sed, id: this.docID+'.txt', tf:1})
            });  
            this.docID++;
        })
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
        }
        
    }
    buildIndex(){
        let counter = 1
        for(let i=0; i<this.words.length-1; i++)
        {
            let j = i + 1
            let y = i
            counter = 1
            let array = []
            while(this.words[i].term === this.words[j++].term){
               counter++ 
               array.push({id: this.words[y].id, tf: this.words[y].tf, disabled: false})
               y++
            }
            array.push({id: this.words[y].id, tf: this.words[y].tf, disabled: false})

            this.map.set(this.words[i].term, {docs: counter, locations:array})
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
                this.map.set(this.words[i].term, {docs: 1, locations: [{id: this.words[i].id, tf: this.words[i].tf}]})
           }
        }
    }

    test(){
        console.log(this.map.get("fields"))    
            
    }
}
