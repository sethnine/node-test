const express = require("express");
const app = express();
var session = require("express-session");

const revision = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString()
  .trim();

app.use(
  session({
    secret: "CHANGEME",
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

app.get("/", express.static("content"));

app.get("/visitCount", (req, res) => {
  if (req.session.visitCount == null) req.session.visitCount = 0;
  req.session.visitCount++;
  res.send(JSON.stringify({ visitCount: req.session.visitCount }));
});

// app.get("/", (req, res) => {
//   let counter;
//   if (!req.session.pageViews) {
//     req.session.pageViews = 1;
//     counter = `<h1> Welcome this is the first time you've visited this page!</h1>`;
//   } else {
//     req.session.pageViews++;
//     counter = `This is the ${req.session.pageViews}th time you've viewed this page!`;
//   }
//   res.send(`<!DOCTYPE html>
// <html lang="en">
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>Hello World</title>
//     <script
//       src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/js/bootstrap.min.js"
//       integrity="sha512-ykZ1QQr0Jy/4ZkvKuqWn4iF3lqPZyij9iRv6sGqLRdTPkY69YX6+7wvVGmsdBbiIfN/8OdsI7HABjvEok6ZopQ=="
//       crossorigin="anonymous"
//       referrerpolicy="no-referrer"
//     ></script>
//     <link
//       rel="stylesheet"
//       href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css"
//       integrity="sha512-jnSuA4Ss2PkkikSOLtYs8BlYIeeIK1h99ty4YfvRPAlzr377vr3CXDb7sb7eEEBYjDtcYj+AjBH3FLv5uSJuXg=="
//       crossorigin="anonymous"
//       referrerpolicy="no-referrer"
//     />
//     <script
//       src="https://cdnjs.cloudflare.com/ajax/libs/vue/3.4.37/vue.global.min.js"
//       integrity="sha512-DqEEvSuoZMoX7siGBL6dqybFZeH0oCysZnIXBq9PHttRbdEWwc7tMk0nlkGhEsLJOMzk1fnNU6OYe/o3V3D61Q=="
//       crossorigin="anonymous"
//       referrerpolicy="no-referrer"
//     ></script>
//   </head>
//   <body>
//     <div id="app" class="container">
//       <header class="p-1 bg-secondary d-flex justify-content-end">
//         <span class="text-light">Rev:{{siteRevision}}</span>
//       </header>
//       <h1>Hello World!</h1>
//       <form @submit.prevent="getRandom()">
//         <label
//           >Min: <input type="number" name="min" pattern="[0-9]" v-model="min"
//         /></label>
//         <label
//           >Max: <input type="number" name="max" pattern="[0-9]" v-model="max"
//         /></label>
//         <button class="btn btn-primary">Get Random</button>
//         <p v-if="randomNumber!==null">The random number is: {{randomNumber}}</p>
//       </form>
//       <p>${counter}</p>
//     </div>
//     <script>
//       const app = Vue.createApp({
//         data() {
//           return {
//             siteRevision: null,
//             min: 0,
//             max: 100,
//             randomNumber: null,
//           };
//         },
//         methods: {
//           getRandom() {
//             fetch(\`/random?min=\${this.min}&max=\${this.max}\`)
//               .then((r) => {
//                 if (!r.ok) throw new Error("Could not fetch");
//                 return r.text();
//               })
//               .then((d) => (this.randomNumber = d))
//               .catch(console.error);
//           },
//           getCommitHash() {
//             fetch("/rev")
//               .then((r) => {
//                 if (!r.ok) throw new Error("Could not fetch Revision");
//                 return r.text();
//               })
//               .then((data) => {
//                 if (this.siteRevision == null) this.siteRevision = data;
//                 else if (this.siteRevision != data) location.reload();
//               })
//               .catch(console.error);
//           },
//         },
//         mounted() {
//           this.getCommitHash();
//           setInterval(this.getCommitHash, 2500);
//         },
//       });
//       vm = app.mount("#app");
//     </script>
//   </body>
// </html>`);
// });

app.get("/random", function (req, res) {
  console.log(req.query);
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
  console.log(req.body);
  res.send(req.body);
});

app.get("/rev", (req, res) => {
  res.send(revision);
});

console.log("running git revision: " + revision);
app.listen(3000);
