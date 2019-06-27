const Crypto = require('crypto');

class Blockchain {

    constructor() {

        this.chain = [],
        this.blockCurent = {};
        this.blockGenesis = {
            index: 0,
            data: 0,
            informatie: 'date importante',
            hashPrecedent: "0",
            nonce: 0
        };
        this.blockGenesis.hash = this.generareHash(this.blockGenesis);
        this.chain.push(this.blockGenesis);
        this.blockCurent = this.blockGenesis;

    }

    generareHash({data, informatie, index, hashPrecedent, nonce}) {
        return Crypto.createHash('SHA256').update(data + informatie + index + hashPrecedent + nonce).digest('hex');
    }

    adaugareBlock(block) {

        if(this.verificareBlock(block, this.blockCurent)) {
            this.chain.push(block);
            this.blockCurent = block;
            return true;
        }

        return false;
    }

    creareBlock(informatie) {
        let blockNou = {
            data: new Date().getTime(),
            informatie: informatie,
            index: this.blockCurent.index + 1,
            hashPrecedent: this.blockCurent.hash,
            nonce: 0
        }

        blockNou = this.proofOfWork(blockNou);

        return blockNou;
    }

    proofOfWork(blockNou) {
        while(true) {
            blockNou.hash = this.generareHash(blockNou);
            if(blockNou.hash.slice(-3) == '000') {
                return blockNou;
            }
            else {
                blockNou.nonce++;
            }
        }
    }

    verificareChain(chain) {
        if(this.generareHash(chain[0]) != this.blockGenesis.hash) {
            return false;
        }

        let blockPrecedent = chain[0];
        let count = 1;

        while(count < chain.length) {
            let blockCurent = chain[count];

            if(blockCurent.hashPrecedent != this.generareHash(blockPrecedent))
                return false;
            
            if(blockCurent.hash.slice(-3) !== "000")
                return false;

            blockPrecedent = blockCurent;
            count++;
        }

        return true;
    }

    inlocuireChain(chain) {
        this.chain = chain;
        this.blockCurent = chain[ chain.length - 1 ];
    }

    ultimulBlock() {
        return this.blockCurent;
    }

    numarDeBlockuri() {
        return this.chain.length;
    }

    verificareBlock(block, blockPrecedent) {
        if(blockPrecedent.index +1 != block.index) 
            return false;
        else if(blockPrecedent.hash != block.hashPrecedent) 
            return false;
        else if(!this.verificareHash(block)) 
            return false;
        return true;
    }

    verificareHash(block) {
        return this.generareHash(block) == block.hash;
    }
}

module.exports = Blockchain;