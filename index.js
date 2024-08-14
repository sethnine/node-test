const { log } = require("console");
const express = require("express");
const app = express();
var session = require("express-session");
const { isNull } = require("util");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const revision = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();

let users = [
  {
    username: "jordan",
    password: "$2b$10$w5W0CwSdfmuy5hMXMcxLEeTcl4rQH7fmGT1roT67mTY0XWr8smw/S", //password1
  },
  {
    username: "jordan2",
    password: "$2b$10$w5W0CwSdfmuy5hMXMcxLEeTcl4rQH7fmGT1roT67mTY0XWr8smw/S",
  },
];
app.use(
  session({
    secret: "CHANGEME1",
    cookie: {
      maxAge: 1000 * 60 * 30, // 30 minutes
    },
  })
);

app.get("/endsession", (req, res) => {
  req.session.destroy();
  res.send(`Your session has been destroyed, redirecting...
        <script>setTimeout(()=>{window.location.replace("/")},5000)</script>`);
});

app.use("/", express.static("content"));

app.get("/visitCount", (req, res) => {
  if (req.session.visitCount == null) req.session.visitCount = 0;
  req.session.visitCount++;
  res.send(JSON.stringify({ visitCount: req.session.visitCount }));
});

app.get("/random", function (req, res) {
  // console.log(req.query);
  let min = 0;
  if (!(typeof req.query.min == "undefined")) {
    if (!isNaN(parseInt(req.query.min))) min = parseInt(req.query.min);
  }
  let max = 100;
  if (!(typeof req.query.max == "undefined")) {
    if (!isNaN(parseInt(req.query.max))) max = parseInt(req.query.max);
  }
  const diff = Math.max(max, min) - Math.min(max, min);

  const rn = Math.min(max, min) + Math.round(Math.random() * diff);
  const rns = String(rn);
  res.send(rns);
});

app.use("/query", express.urlencoded());
app.post("/query", function (req, res) {
  // console.log(req.body);
  res.send(req.body);
});

app.get("/rev", (req, res) => {
  res.send(revision);
});

app.use("/register", express.json({ limit: "1kb" }));
app.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
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

  // username already taken
  if (users.find((u) => u.username === username)) {
    res.status(409).json({ error: "username taken" });
    return;
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    console.log(err);
    // log(username, hash);
    users.push({
      username: username,
      password: hash,
    });
  });

  req.session.username = username;
  res.status(200).json({ message: "Login successful" });
});

app.use("/login", express.json({ limit: "1mb" }));
app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  // console.log(req.body);

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
  const u = users.find((u) => u.username === req.body.username);
  if (u === undefined) {
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
      res.status(401).json({ error: "cannot find matching user creds" }); // wrong password
      return;
    }

    req.session.username = username;
    res.status(200).json({ message: "Login successful" });
  });
});

app.use("/members", authCheck, express.static("members"));
function authCheck(req, res, next) {
  if (req.session.username) next();
  else res.redirect("/login");
}

console.log("running git revision: " + revision);
app.listen(3000);
