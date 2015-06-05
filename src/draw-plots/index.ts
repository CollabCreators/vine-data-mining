import LocalStorage from "../simple-worker/local-storage";
import ArrayHelper from "../helpers/arrayHelper";
import * as fs from "fs";
import * as path from "path";
import * as mkdirp from "mkdirp";
let Plotly = require("plotly");

export default class DrawPlots {

  private static FIGURE_PATH = path.resolve(__dirname, "../../../report/figures/");

  private plotly;
  private localStorage: LocalStorage;
  private users: Array<UserVines>;

  constructor() {
    // Check if PLOTLY_KEY environment variable is set.
    if (!process.env.PLOTLY_KEY) {
      throw Error("Missing environment variable PLOTLY_KEY.");
    }
    mkdirp.sync(DrawPlots.FIGURE_PATH);
    // Initialize plotly connector.
    this.plotly = Plotly("markogresak", process.env.PLOTLY_KEY);
    this.localStorage = new LocalStorage();
    this.users = [];
    this.begin();
  }

  private begin(): void {
    this.readUserData()
      .then(() => this.drawFollowerPostsPlot())
      .then(() => this.drawFollowerViewsPlot())
      .then(() => this.viewsOverTime())
      .then(() => this.drawFollowerCooperationsPlot())
      .catch((err) => console.error(err.stack));
  }

  private readUserData(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.localStorage.readData().then((data: string) => {
        this.users = data.split("\n")
          .map((l) => l.trim().length === 0 ? null : JSON.parse(l))
          .filter((u) => u !== null && u.type === 0);
        resolve();
      });
    });
  }

  private drawFollowerPostsPlot(): Promise<any> {
    return new Promise((resolve, reject) => {
      let trace = {
        x: this.users.map((u) => u.followerCount),
        y: this.users.map((u) => u.authoredPostCount),
        text: this.users.map((u) => u.username.replace(/[^a-zA-Z]/g, "")),
        mode: "markers",
        name: "Users",
        marker: {
          color: "rgb(0, 191, 143)",
          size: 6,
          line: {
            color: "white",
            width: 0.5
          }
        },
        type: "scatter"
      };
      let layout = {
        title: "Amout of followers related to post count",
        xaxis: {
          title: "Followers",
          showgrid: true,
          zeroline: true
        },
        yaxis: {
          title: "Posts",
          showline: false
        }
      };
      let imgOpts = {
        format: "png",
        width: 1000,
        height: 500
      };
      let figure = {
        data: [trace],
        layout: layout
      };
      let graphOptions = { layout: layout, filename: "follower-posts", fileopt: "overwrite" };
      this.plotly.plot(figure.data, graphOptions, function(error, msg) {
        if (error) {
          return console.error("error", error);
        }
        console.log(`${msg.filename}, url: ${msg.url}`);
      });

      this.plotly.getImage(figure, imgOpts, (error, imageStream) => {
        if (error) {
          return console.error("error", error);
        }
        let fileName = path.resolve(DrawPlots.FIGURE_PATH, "follower-posts.png");
        let fileStream = fs.createWriteStream(fileName);
        imageStream.pipe(fileStream);
        console.log("saved", fileName);
        resolve();
      });
    });
  }

  private drawFollowerViewsPlot(): Promise<any> {
    return new Promise((resolve, reject) => {
      let avgFn = (arr: Array<number>) => arr.reduce((a, b) => a + b, 0) / arr.length;
      let popup = (u) => `Uploads: ${u.loopCounts.length}\n${u.username.replace(/[^a-zA-Z]/g, "") }`;
      let traceTotal = {
        x: this.users.map((u) => u.followerCount),
        y: this.users.map((u) => u.loopCount),
        mode: "markers",
        name: "Views",
        text: this.users.map(popup),
        marker: {
          color: "rgb(80, 130, 229)",
          size: 6,
          line: {
            color: "white",
            width: 0.5
          }
        },
        type: "scatter"
      };
      let traceAvg = {
        x: this.users.map((u) => u.followerCount),
        y: this.users.map((u) => u.loopCounts.length > 0 ? avgFn(u.loopCounts) : 0),
        text: this.users.map(popup),
        mode: "markers",
        name: "Average views",
        marker: {
          color: "rgb(255, 185, 115)",
          size: 6,
          line: {
            color: "white",
            width: 0.5
          }
        },
        type: "scatter"
      };
      let layoutAvg = {
        title: "Average views related to number of followers",
        xaxis: {
          title: "Followers",
          showgrid: true,
          zeroline: true
        },
        yaxis: {
          title: "Views (loops)",
          showline: false
        }
      };
      let layoutTotal = {
        title: "Total views related to number of followers",
        xaxis: {
          title: "Followers",
          showgrid: true,
          zeroline: true
        },
        yaxis: {
          title: "Views (loops)",
          showline: false
        }
      };
      let imgOpts = {
        format: "png",
        width: 1000,
        height: 500
      };
      let figureAvg = {
        data: [traceAvg],
        layout: layoutAvg
      };
      let figureTotal = {
        data: [traceTotal],
        layout: layoutTotal
      };
      let graphAvgOptions = { layout: layoutAvg, filename: "follower-avg-views", fileopt: "overwrite" };
      this.plotly.plot(figureAvg.data, graphAvgOptions, function(error, msg) {
        if (error) {
          return console.error("error", error);
        }
        console.log(`${msg.filename}, url: ${msg.url}`);
      });

      this.plotly.getImage(figureAvg, imgOpts, (error, imageStream) => {
        if (error) {
          return console.error("error", error);
        }
        let fileName = path.resolve(DrawPlots.FIGURE_PATH, "follower-avg-views.png");
        let fileStream = fs.createWriteStream(fileName);
        imageStream.pipe(fileStream);
        console.log("saved", fileName);
        resolve();
      });
      let graphTotalOptions = { layout: layoutTotal, filename: "follower-total-views", fileopt: "overwrite" };
      this.plotly.plot(figureTotal.data, graphTotalOptions, function(error, msg) {
        if (error) {
          return console.error("error", error);
        }
        console.log(`${msg.filename}, url: ${msg.url}`);
      });

      this.plotly.getImage(figureTotal, imgOpts, (error, imageStream) => {
        if (error) {
          return console.error("error", error);
        }
        let fileName = path.resolve(DrawPlots.FIGURE_PATH, "follower-total-views.png");
        let fileStream = fs.createWriteStream(fileName);
        imageStream.pipe(fileStream);
        console.log("saved", fileName);
        resolve();
      });
    });
  }

  private viewsOverTime(): Promise<any> {
    return new Promise((resolve, reject) => {
      let colors = [
        "rgb(0,191,143)", "rgb(255,121,77)", "rgb(255,175,64)", "rgb(120,112,204)", "rgb(242,121,172)",
        "rgb(255,89,103)", "rgb(80,130,229)", "rgb(190,95,182)", "rgb(204,204,82)", "rgb(84,136,153)"]
      let generateTrace = (user: UserVines, i: number, allDates) => {
        return {
          x: allDates,
          y: user.loopCounts,
          name: user.username.replace(/[^a-zA-Z]/g, ""),
          marker: {
            color: colors[i],
            size: 6,
            line: {
              color: "white",
              width: 0.5
            }
          },
          type: "scatter"
        };
      };
      let compareDates = (a, b) => new Date(a).getTime() - new Date(b).getTime();
      let top10 = this.users
        .sort((a, b) => b.followerCount - a.followerCount)
        .slice(0, 10);
      let allDates: any = top10.map((u) => u.vinesCreated);
      allDates.unshift(null);
      allDates = ArrayHelper.mergeUnique.apply(null, allDates).sort(compareDates);
      top10 = top10.map((u) => {
        let sorted = u.vinesCreated.map((date: any, i) => [date, u.loopCounts[i]]).sort((a, b) => compareDates(a[0], b[0]));
        u.vinesCreated = allDates;
        u.loopCounts = [];
        if (sorted.length === 0) {
          u.loopCounts = u.vinesCreated.map(() => 0);
          return u;
        }
        let sortedI = 0;
        allDates.forEach((date: any) => {
          let count = 0;
          if (sorted[sortedI] && sorted[sortedI][0] === date) {
            count = sorted[sortedI][1];
            sortedI++;
          }
          u.loopCounts.push(count);
        });
        return u;
      });
      let layout = {
        title: "Views over time for 10 most followed users",
        xaxis: {
          title: "Time",
          showgrid: false,
          zeroline: true
        },
        yaxis: {
          title: "Vine views (loops)",
          showline: false
        }
      };
      let imgOpts = {
        format: "png",
        width: 1000,
        height: 500
      };
      let figure = {
        data: top10.map((u, i) => generateTrace(u, i, allDates)),
        layout: layout
      };
      let graphOptions = { layout: layout, filename: "views-over-time", fileopt: "overwrite" };
      this.plotly.plot(figure.data, graphOptions, function(error, msg) {
        if (error) {
          return console.error("error", error);
        }
        console.log(`${msg.filename}, url: ${msg.url}`);
      });

      this.plotly.getImage(figure, imgOpts, (error, imageStream) => {
        if (error) {
          return console.error("error", error);
        }
        let fileName = path.resolve(DrawPlots.FIGURE_PATH, "views-over-time.png");
        let fileStream = fs.createWriteStream(fileName);
        imageStream.pipe(fileStream);
        console.log("saved", fileName);
        resolve();
      });
    });
  }

  private drawFollowerCooperationsPlot(): Promise<any> {
    return new Promise((resolve, reject) => {
      let trace = {
        x: this.users.map((u) => u.followerCount),
        y: this.users.map((u) => Object.keys(u.mentioned).length),
        mode: "markers",
        name: "Mentioned users",
        text: this.users.map((u) => u.username.replace(/[^a-zA-Z]/g, "")),
        marker: {
          color: "rgb(0, 191, 143)",
          size: 6,
          line: {
            color: "white",
            width: 0.5
          }
        },
        type: "scatter"
      };
      let layout = {
        title: "User followers / mentioned users",
        xaxis: {
          title: "Followers",
          showgrid: true,
          zeroline: true
        },
        yaxis: {
          title: "Mentioned users",
          showline: false
        }
      };
      let imgOpts = {
        format: "png",
        width: 1000,
        height: 500
      };
      let figure = {
        data: [trace],
        layout: layout
      };
      let graphOptions = { layout: layout, filename: "follower-cooperations", fileopt: "overwrite" };
      this.plotly.plot(figure.data, graphOptions, function(error, msg) {
        if (error) {
          return console.error("error", error);
        }
        console.log(`${msg.filename}, url: ${msg.url}`);
      });

      this.plotly.getImage(figure, imgOpts, (error, imageStream) => {
        if (error) {
          return console.error("error", error);
        }
        let fileName = path.resolve(DrawPlots.FIGURE_PATH, "follower-cooperations.png");
        let fileStream = fs.createWriteStream(fileName);
        imageStream.pipe(fileStream);
        console.log("saved", fileName);
        resolve();
      });
    });
  }

}
