const { describe, it } = require('mocha');
const { assert, expect } = require('chai');
const should = require('chai').should();

describe('DataMocker: Generate random data',()=>{
    describe('generate()',()=>{
        const datamocker = require('../src/utils/datamocker');
        it('should return true', ()=>{
            const sourceFilename = 'sample1.json';
            const result = datamocker.generateFromFile(sourceFilename);
            assert.isNotNull(result);
            assert.isArray(result);
            assert.isTrue(result.length>0 || false);
            expect(result).to.have.lengthOf(45);
            result.forEach(element => {
                expect(element).to.have.keys(['business','product','date','amount','quantity','updatedAt']);
            });
        });
    });
});
 