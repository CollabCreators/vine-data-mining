import * as chai from "chai";
import * as sinon from "sinon";
chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("Job", () => {
  it("should pass", (done) => {
    true.should.be.true;
    done();
  });

});
