const indexFile = require('./indexFile')

var index = new indexFile
index.extractWords()
index.buildIndex()
index.test()
//index.updateIndex()
//index.test()