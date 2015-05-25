import * as chai from "chai";
import * as sinon from "sinon";
chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import Job from "../src/master/job";
import JobState from "../src/master/JobState";

describe("Job", () => {

  let job1: Job, job2: Job, otherJob: Job;

  beforeEach((done) => {

    let data = {
      type: 1, // JobType.Vine
      id: "123"
    };
    job1 = new Job(data, 1);
    job2 = new Job(data, 2);
    otherJob = new Job({
      type: 1,
      id: "12345"
    }, 1);
    done();
  });

  describe("getters", () => {

    it("should conatin priority property (getter and setter)", (done) => {
      job1.priority.should.exist;
      job1.priority.should.equal(1);
      done();
    });

    it("should have a priority 1 by default", (done) => {
      let job = new Job(null);
      job.priority.should.equal(1);
      done();
    });

    it("should conatin type getter", (done) => {
      job1.type.should.exist;
      job1.type.should.equal(1); // JobType.Vine
      done();
    });

    it("should conatin id getter", (done) => {
      job1.id.should.exist;
      job1.id.should.equal("123"); // Id set in beforeEach.
      done();
    });

    it("should conatin state getter which equals JobState.Idle (0) by default", (done) => {
      job1.state.should.equal(JobState.Idle);
      done();
    });

  });

  describe("instance functions", () => {

    describe("to change state", () => {

      it("should include function bumpPriority which increases priority by 1", (done) => {
        job1.bumpPriority.should.exist;
        job1.priority.should.equal(1);
        for (let i = 2; i <= 5; i++) {
          job1.bumpPriority();
          job1.priority.should.equal(i);
        }
        done();
      });

      it("should include function markActive which changes state to Pending", (done) => {
        job1.state.should.equal(JobState.Idle);
        job1.markActive();
        job1.state.should.equal(JobState.Pending);
        done();
      });

      it("should include function markDone which changes state to Fulfilled", (done) => {
        job1.state.should.equal(JobState.Idle);
        job1.markDone();
        job1.state.should.equal(JobState.Fulfilled);
        done();
      });

    });

    describe("for comparison", () => {

      it("should match equality to other job by id", (done) => {
        job1.equals.should.exist;
        // Compare same jobs.
        job1.equals(job1).should.be.true;
        // Compare jobs with same id.
        job1.equals(job2).should.be.true;
        // Compare jobs with differnet id.
        job1.equals(otherJob).should.be.false;
        done();
      });

      it("should compare priority to another job", (done) => {
        // Compare same jobs.
        job1.compare(job1).should.be.true;
        // Compare job with higher priority.
        job1.compare(job2).should.be.false;
        // Compare job with lower priority.
        job2.compare(job1).should.be.true;
        done();
      });
    });

  });

  describe("should have a static function", () => {

    it("to compare two jobs", (done) => {
      Job.CompareJobs.should.exist;
      // Compare 2 same jobs, should be equal.
      Job.CompareJobs(job1, job1).should.equal(0);
      // Compare job1 (lower) to job2 (higher), job2 should have higher prioirty.
      Job.CompareJobs(job1, job2).should.be.above(0);
      // Compare job2 (higher) to job2 (lower), job1 should have lower prioirty.
      Job.CompareJobs(job2, job1).should.be.below(0);
      done();
    });

    it("to sort an array of jobs", (done) => {
      Job.Sort.should.exist;
      let jobs: Array<Job> = [];
      // Add jobs in with priorities in ascending order.
      for (let i = 0; i <= 5; i++) {
        jobs.push(new Job(null, i));
      }
      // Sort jobs (by priority), job with [0] has highest priority.
      let sortedJobs = Job.Sort(jobs);
      // priority should be inversely proportional to index.
      for (let i = 0; i <= 5; i++) {
        sortedJobs[i].priority.should.equal(5 - i);
      }
      done();
    });

    it("to filter an array of jobs to keep idle jobs only", (done) => {
      let jobs: Array<Job> = [];
      for (let i = 0; i <= 5; i++) {
        jobs.push(new Job(null, i));
      }
      jobs[0].markActive();
      jobs[5].markDone();
      let filtered = Job.FilterIdle(jobs);
      filtered.length.should.equal(4);
      for(let i = 0; i < 4; i++) {
        // Compare by priority as it's only distinction between jobs.
        filtered[i].priority.should.equal(jobs[i + 1].priority);
      }
      done();
    });

  });

});
