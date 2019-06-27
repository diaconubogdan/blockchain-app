const express = require('express');
const bodyParser = require('body-parser');
const Node = require('./node');
const program = require('commander');

program
    .option('-h, --http-port <port>', 'HTTP Server Port', '8080')
    .option('-w, --ws-port <port>', 'WebSocket Port', '3000')
program.parse(process.argv);

const HTTP_PORT = parseInt(program.httpPort);

let httpServer = function() {
    let app = new express();

    let nod = new Node(parseInt(program.wsPort));

    app.use(bodyParser.json());

    app.set('view engine', 'ejs');

    app.use(express.static(__dirname + '/public'));

    app.get('/', (req, res) => {
        res.render('index', {
            blocks: nod.statistici().chain,
            httpPort: HTTP_PORT,
            socketPort: program.wsPort
        });
    })

    app.get('/adaugaNod/:port', (req, res) => {
        nod.adaugareNod('localhost', req.params.port);
        console.log(`Adaug nodul cu portul ${req.params.port}.`)
        let blocks = nod.statistici().chain;
        res.json({blocks: blocks});
    })

    app.get('/adaugaBlock/:informatie', (req, res) => {
        let blockNou = nod.creareBlock(req.params.informatie);
        console.log(`Am adaugat un block nou. Hash: ${blockNou.hash}.`);
        let statistici = nod.statistici();
        console.log(`In blockchain exista ${statistici.numarDeBlockuri} blockuri. Acestea sunt:`)
        statistici.chain.forEach(block => {
            let date = new Date(block.data).toLocaleDateString("en-US") + ' ' + new Date(block.data).toLocaleTimeString("en-US");
            console.log(`-------\nData: ${date}\nIndex: ${block.index}\nHash: ${block.hash}\nHash precedent: ${block.hashPrecedent}\nInformatie: ${block.informatie}`);
        })
        res.json({blocks: statistici.chain});
    })

    app.listen(HTTP_PORT, () => {
        console.log('Serverul HTTP a pornit pe portul', HTTP_PORT);
        console.log(`Link interfata: http://localhost:${HTTP_PORT}`)
    })
}

let httpserver = new httpServer();