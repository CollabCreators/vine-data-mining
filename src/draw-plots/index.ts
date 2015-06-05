import LocalStorage from "../simple-worker/local-storage";
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
        y: this.users.map((u) => u.postCount),
        // text: this.users.map((u) => u.username),
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
        title: "User followers / posts",
        xaxis: {
          title: "Followers",
          showgrid: true,
          zeroline: true
        },
        yaxis: {
          title: "Posts (including reposts)",
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
      let traceTotal = {
        x: this.users.map((u) => u.followerCount),
        y: this.users.map((u) => u.loopCount),
        mode: "markers",
        name: "Views",
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
        mode: "markers",
        name: "Avg views",
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
      let layout = {
        title: "User followers / views",
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
      let figure = {
        data: [traceAvg, traceTotal],
        layout: layout
      };
      let graphOptions = { layout: layout, filename: "follower-views", fileopt: "overwrite" };
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
        let fileName = path.resolve(DrawPlots.FIGURE_PATH, "follower-views.png");
        let fileStream = fs.createWriteStream(fileName);
        imageStream.pipe(fileStream);
        console.log("saved", fileName);
        resolve();
      });
    });
  }

}
