import express, { Express, NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import session from 'express-session';
import { MongoClient } from "mongodb";
import { error } from 'console';
require("dotenv").config();

declare module "express-session" {
  interface SessionData {
    visitCount: number;
    username: string;
  }
}

const app = express();
app.use(
  session({
    secret: "CHANGEME1",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 30, // 30 minutes
    },
  })
);

const saltRounds = 10;

const SERV_PORT=process.env.SERV_PORT||3000;

if (process.env.dbURI === undefined) {
  console.log("dbURI is not set aborting!")
  process.abort()
}
if (process.env.dbCOLLECTION === undefined) {
  console.log("dbCOLLECTION is not set aborting!")
  process.abort()
}
const client: MongoClient = new MongoClient(process.env.dbURI!);
async function printUsercount() {
  await client.connect();
  console.log("connected to server!");
  const db = client.db(process.env.dbNAME);
  const collection = db.collection(process.env.dbCOLLECTION!);
  console.log(await collection.countDocuments(), "users in users table");
}

printUsercount();

// store running git revision
const revision = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();



app.get("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    console.log(err);
    res.send("You are now logged out <script>setTimeout(()=>{window.location.href='/'}, 5000)</script>");
  });
});
app.use("/", express.static("content"));

app.get("/visitCount", (req: Request, res: Response) => {
  if (typeof req.session.visitCount === "undefined") {
    req.session.visitCount = 0;
  }
  req.session.visitCount++;
  res.send(JSON.stringify({ visitCount: req.session.visitCount }));
});

app.get("/random", function (req: Request, res: Response) {
  // console.log(req.query);
  let min = 0;
  if (!(typeof req.query.min == "undefined")) {
    if (!isNaN(parseInt(req.query.min.toString()))) min = parseInt(req.query.min.toString());
  }
  let max = 100;
  if (!(typeof req.query.max == "undefined")) {
    if (!isNaN(parseInt(req.query.max.toString()))) max = parseInt(req.query.max.toString());
  }
  const diff = Math.max(max, min) - Math.min(max, min);

  const rn = Math.min(max, min) + Math.round(Math.random() * diff);
  const rns = String(rn);
  res.send(rns);
});

app.use("/query", express.urlencoded());
app.post("/query", function (req: Request, res: Response) {
  // console.log(req.body);
  res.send(req.body);
});

app.get("/rev", (_: Request, res: Response) => {
  res.send(revision);
});

app.use("/register", express.json({ limit: "1kb" }));
app.post("/register", async (req: Request, res: Response) => {
  const username = req.body.username;
  const password = req.body.password;

  await client.connect();
  // console.log("connected to server!");
  const db = client.db(process.env.dbNAME);
  const users = db.collection(process.env.dbCOLLECTION!);

  // console.log(req.body);
  if (typeof username === "undefined") {
    // no username input
    res.status(400).json({ error: "no username input" });
    return;
  }
  if (typeof password === "undefined") {
    // no password input
    res.status(400).json({ error: "no password input" });
    return;
  }

  const user = await users.findOne({ username: username });
  if (user) {
    res.status(409).json({ error: "username taken" });
    return;
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    console.log(err);
    // log(username, hash);
    users.insertOne({
      username: username,
      password: hash,
    });
  });

  req.session.username = username;
  res.status(200).json({ message: "Login successful" });
});

app.use("/login", express.json({ limit: "1mb" }));
app.post("/login", async (req: Request, res: Response) => {
  const username = req.body.username;
  const password = req.body.password;
  const db = client.db(process.env.dbNAME);
  const users = db.collection(process.env.dbCOLLECTION!);
  // console.log(req.body);

  // make sure input was given
  if (typeof username === "undefined") {
    // no username input
    res.status(400).json({ error: "bad request!" });
    return;
  }
  if (typeof password === "undefined") {
    // no password input
    res.status(400).json({ error: "bad request!" });
    return;
  }

  // const u = users.find((u) => u.username === req.body.username);
  const u = await users.findOne({
    username: username,
  });
  if (!u) {
    // no matching user in db
    // console.log("cannot find user", username);
    res
      .status(401)
      .json({ error: "cannot find matching user with matching credentials" });
    return;
  }
  // console.log(u);
  bcrypt.compare(password, u.password, (err, result) => {
    // console.log(result);
    if (err) {
      console.error("bcrypt error", err);
      res.status(500).json({ error: "internal server error" });
      return;
    }

    if (!result) {
      res
        .status(401)
        .json({ error: "cannot find matching user with matching credentials" }); // wrong password
      return;
    }

    req.session.username = username;
    res.status(200).json({ message: "Login successful" });
  });
});

app.use("/members", authCheck, express.static("members"));
function authCheck(req: Request, res: Response, next: NextFunction) {
  if (req.session.username) next();
  else res.redirect("/login");
}

console.log("running git revision: " + revision);
console.log("Starting server at: http://127.1:"+SERV_PORT)
app.listen(SERV_PORT);
