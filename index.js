const express = require('express')
const app = express()

const revision = require('child_process')
.execSync('git rev-parse --short HEAD')
.toString().trim()

app.get('/', express.static('content'))

app.get('/random', function (req, res) {
    console.log(req.query);
    let min = 0
    if (! (typeof req.query.min == "undefined")) {
        if (!isNaN(parseInt(req.query.min)))
            min = parseInt(req.query.min)
    }
    let max = 100
    if (! (typeof req.query.max == "undefined")) {
        if (!isNaN(parseInt(req.query.max)))
            max = parseInt(req.query.max)
    }
    const diff = Math.max(max,min)-Math.min(max,min);

    const rn = Math.min(max,min)+Math.round(Math.random()*diff);
    const rns = String(rn);
  res.send(rns);
})

app.use('/query', express.urlencoded());
app.post('/query', function (req, res) {
    console.log(req.body)
    res.send(req.body);
}

)

app.get('/rev', (req,res)=>{
    res.send(revision);
});

console.log("running git revision: "+ revision)
app.listen(3000)