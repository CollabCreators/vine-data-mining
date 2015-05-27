import * as chai from "chai";
import * as sinon from "sinon";
chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import ArrayHelper from "../src/helpers/arrayHelper";

describe("ArrayHelper", () => {

  describe("mergeUnique", () => {

    let arr1: Array<any>, arr2: Array<any>, arr3: Array<any>;
    let merged12: Array<any>, merged23: Array<any>, merged123: Array<any>;

    describe("arrays of primitive values", () => {

      beforeEach((done) => {
        arr1 = [1, 2, 3];
        arr2 = [4, 5, 6];
        arr3 = [4, 6, 7];
        merged12 = [1, 2, 3, 4, 5, 6];
        merged23 = [4, 5, 6, 7];
        merged123 = [1, 2, 3, 4, 5, 6, 7];
        done();
      });

      it("should merge two completely differnet arrays", (done) => {
        ArrayHelper.mergeUnique(null, arr1, arr2).should.eql(merged12);
        done();
      });

      it("should merge two array and keep only unique values", (done) => {
        ArrayHelper.mergeUnique(null, arr2, arr3).should.eql(merged23);
        done();
      });

      it("should merge three arrays and keep only unique values", (done) => {
        ArrayHelper.mergeUnique(null, arr1, arr2, arr3).should.eql(merged123);
        done();
      });

    });

    describe("arrays of objects", () => {

      let compareFn;

      beforeEach((done) => {
        arr1 = [{ id: 1, val: 11 }, { id: 2, val: 12 }, { id: 3, val: 13 }];
        arr2 = [{ id: 4, val: 14 }, { id: 5, val: 15 }, { id: 6, val: 16 }];
        arr3 = [{ id: 4, val: 14 }, { id: 6, val: 16 }, { id: 7, val: 17 }];
        merged12 = [
          { id: 1, val: 11 }, { id: 2, val: 12 }, { id: 3, val: 13 },
          { id: 4, val: 14 }, { id: 5, val: 15 }, { id: 6, val: 16 }
        ];
        merged23 = [{ id: 4, val: 14 }, { id: 5, val: 15 }, { id: 6, val: 16 }, { id: 7, val: 17 }];
        merged123 = [
          { id: 1, val: 11 }, { id: 2, val: 12 }, { id: 3, val: 13 }, { id: 4, val: 14 },
          { id: 5, val: 15 }, { id: 6, val: 16 }, { id: 7, val: 17 }
        ];
        compareFn = (x, i, arr) => {
          for (let j = 0; j < i; j++) {
            for (let key in arr[j]) {
              if (arr[j][key] === x[key]) {
                return false;
              }
            }
          }
          return true;
        }
        done();
      });

      it("should merge two completely differnet arrays", (done) => {
        ArrayHelper.mergeUnique(compareFn, arr1, arr2).should.eql(merged12);
        done();
      });

      it("should merge two array and keep only unique values", (done) => {
        ArrayHelper.mergeUnique(compareFn, arr2, arr3).should.eql(merged23);
        done();
      });

      it("should merge three arrays and keep only unique values", (done) => {
        ArrayHelper.mergeUnique(compareFn, arr1, arr2, arr3).should.eql(merged123);
        done();
      });

    });

  });

});
