const fs =  require('fs')
const hashmap = require('hashmap')
const TEMP_DIR = './tmp'

module.exports = class indexFile{
    constructor(){
        let words = [];
        let data = fs.readdirSync(TEMP_DIR)
        data.forEach(file => {
            let parsed = fs.readFileSync(TEMP_DIR+'/'+file, 'utf-8')
            parsed = parsed.toString().toLowerCase()
            let seder = parsed.match(/[a-zA-Z]+/g)
            seder.forEach(sed => {
                words.push({term: sed, id: file, tf:1})
            });  
        })
        words.sort((a,b) => {
            if(a.term < b.term)
                return -1
            if(a.term > b.term)
                return 1
            else return 0
        })
        for(let i=0; i<words.length-1; i++)
        {
            let j = i + 1
            while(words[i].term === words[j].term)
            {
                if(words[i].id === words[j].id){
                    words.splice(j,1)
                    words[i].tf++
                }
                else j++ 
            }
        }
        this.map = new hashmap()
        let counter = 1
        for(let i=0; i<words.length-1; i++)
        {
            let j = i + 1
            let y = i
            counter = 1
            let array = []
            while(words[i].term === words[j++].term){
               counter++ 
               array.push({id: words[y].id, tf: words[y].tf})
               y++
            }
            array.push({id: words[y].id, tf: words[y].tf})
            this.map.set(words[i].term, {docs: counter, locations:array})
            if (counter > 1)
                i += counter -1    
        }
    }
    test(){
            console.log(this.map.get("a"))  
    }
}
