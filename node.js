const Blockchain = require('./blockchain');
const WebSocket = require('ws');

class Node {

    constructor(port) {
        this.nodeSockets = [];
        this.blockchain = new Blockchain();

        this.nodeSocket = new WebSocket.Server({port});

        console.log(`Socket-ul a pornit pe portul ${port}`);

        let _this = this;

        this.nodeSocket.on('connection', function(conexiune) {
            console.log('Se conecteaza..');
            _this.initializareConexiune(conexiune);
        })
    }

    procesareMesaj(conexiune) {
        let _this = this;
        conexiune.on('message', function(data) {
            const msg = JSON.parse(data);
            switch(msg.eveniment) {
                case 'blockNou':
                    _this.proceseazaBlockNou(msg.mesaj);
                    break;
                case 'cereBlockchain':
                    conexiune.send(JSON.stringify({eveniment: 'actualizareBlockuri', mesaj: _this.blockchain.chain}))
                    break;
                case 'actualizareBlockuri':
                    _this.proceseazaActualizareBlockuri(msg.mesaj);
                    break;
                case 'cereUltimulBlock':
                    _this.cereUltimulBlock(conexiune);
                    break;
                default:
                    console.log('Eveniment necunoscut');
            }
        })
    }

    cereUltimulBlock(conexiune) {
        conexiune.send(JSON.stringify({ 
            eveniment: 'blockNou',
            mesaj: this.blockchain.ultimulBlock() }));
    }

    broadcastMesaj(eveniment, mesaj) {
        this.nodeSockets.forEach(nodeSocket => {
            nodeSocket.send(JSON.stringify({eveniment, mesaj}))
        })
    }

    proceseazaBlockNou(block) {
        let ultimul = this.blockchain.ultimulBlock();
        if(block.index <= ultimul.index) {
            return;
        }
        if(block.hashPrecedent == ultimul.hash) {
            this.blockchain.adaugareBlock(block);
        }
        else {
            this.broadcastMesaj('cereBlockchain', '');
        }
    }

    proceseazaActualizareBlockuri(blockuri) {
        let blockuriSortate = blockuri.sort((a, b) => a.index - b.index);
        if(blockuriSortate.length > this.blockchain.numarDeBlockuri() && this.blockchain.verificareChain(blockuriSortate)) {
            this.blockchain.inlocuireChain(blockuriSortate);
            console.log('Blockchain-ul a fost actualizat');
        }
    }

    inchideConexiune(conexiune) {
        console.log('Se inchide conexiunea');
        this.nodeSockets.splice(this.nodeSockets.indexOf(conexiune), 1);
    }

    initializareConexiune(conexiune) {
        this.procesareMesaj(conexiune);

        this.cereUltimulBlock(conexiune);

        this.nodeSockets.push(conexiune);

        let _this = this;

        conexiune.on('error', function() {
            _this.inchideConexiune(conexiune);
        });
        
        conexiune.on('close', function() {
            _this.inchideConexiune(conexiune);
        })
    }

    creareBlock(informatie) {
        let blockNou = this.blockchain.creareBlock(informatie);
        this.blockchain.adaugareBlock(blockNou);

        this.broadcastMesaj('blockNou', blockNou);

        return blockNou;
    }

    statistici() {
        return {
            numarDeBlockuri: this.blockchain.numarDeBlockuri(),
            chain: this.blockchain.chain
        }
    }

    adaugareNod(host, port) {
        let conexiune = new WebSocket(`ws://${host}:${port}`);

        let _this = this;

        conexiune.on('error', function(err) {
            console.log(err);
        })

        conexiune.on('open', function() {
            _this.initializareConexiune(conexiune);
        })
    }
}

module.exports = Node;