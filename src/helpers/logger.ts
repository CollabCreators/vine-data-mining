import Job from "../master/job";

export default class Logger {

  public static logJobs(message: string, jobs: Array<Job>): void {
    try {
      console.log(message, jobs.map(j => j.uid));
    }
    catch (e) {
      console.error("Error while logging jobs: ");
    }
  }

}
