const express = require('express');
const app = express()
const server = require('http').Server(app);
const socket = require('socket.io');
const io = socket(server);
const { v4: uuidV4 } = require('uuid');
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const csrfMiddleware = csrf({ cookie: true });

const port = process.env.PORT || 3000;
//const userS = [], userI = [];
const users={};
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html')
// })
app.engine("html", require("ejs").renderFile);
// app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csrfMiddleware);

app.all("*", (req, res, next) => {
  res.cookie("XSRF-TOKEN", req.csrfToken());
  next();
});

app.get("/login", function (req, res) {
  res.render("login.html");
});

app.get("/signup", function (req, res) {
  res.render("signup.html");
});

app.get("/profile", function (req, res) {
  const sessionCookie = req.cookies.session || "";

  admin
    .auth()
    .verifySessionCookie(sessionCookie, true /** checkRevoked */)
    .then(() => {
      res.render("in.html");
    })
    .catch((error) => {
      res.redirect("/signup");
    });
});

app.get("/", function (req, res) {
  res.render("index.html");
});

app.post("/sessionLogin", (req, res) => {
  const idToken = req.body.idToken.toString();

  const expiresIn = 60 * 60 * 24 * 5 * 1000;

  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success" }));
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

app.get("/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/login");
});
app.get('/new', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
    let addRoomId = req.params.room;
    console.log(addRoomId);
	res.render('index',{roomId: `${addRoomId}` });
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, username) => {
        if (users[roomId]) users[roomId].push({ id: userId, name: username, video: true, audio: true });
        else users[roomId] = [{ id: userId, name: username, video: true, audio: true }];


        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId, username);
        socket.on('message', (message) => {
            io.in(roomId).emit('message', message, userId, username);
        });

        io.in(roomId).emit("participants", users[roomId]);
    })
})
io.on("disconnect", () => {
    socket.to(roomID).broadcast.emit("user-disconnected", userId, username);
})
server.listen(port, () => {
    console.log(`Server started on port: ${port}`);
})