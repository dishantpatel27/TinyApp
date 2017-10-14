var express = require('express');
var app = express();
var PORT = process.env.PORT || 8080;
var cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
app.use(cookieSession({
  name: 'session',
  keys: ['user_id']
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs")
const bcrypt = require('bcrypt');

var urlDatabase = {
  "steve":[{
    "b2xVn2": "http://www.lighthouselabs.ca"
  }],
  "jim":[{
    "g2pP67": "http://www.audi.ca"
  }],
};

const users = {
  "steve": {
    id: "steve",
    email: "user@example.com",
    password: bcrypt.hashSync("123", 10)
  },
  "jim": {
    id: "jim",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
}

function urlList(urlDatabase){
  var lstOfKeys = Object.keys(urlDatabase);
  var arrOfLinks = [];
  for(var i in lstOfKeys){
    arrOfLinks.push(urlDatabase[lstOfKeys[i]]);
  }
  return arrOfLinks;
}


app.get('/',(req,res) => {
  res.redirect("/urls");
});

app.listen(PORT,() => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json",(req,res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/register',(req,res) => {
  let templateVars = {user: users[req.session.user_id]};
  res.render("register",templateVars);
});

app.get("/urls",(req,res) => {
  let templateVars = {user: users[req.session.user_id],urls: urlDatabase[req.session.user_id]};
  res.render("urls_index",templateVars);
});

app.get("/urls/new", (req, res) => {
  var userCookie = req.session.user_id;
  if(users[userCookie]){
    let templateVars = {user: users[req.session.user_id], urls: urlDatabase[req.session.user_id]}
    res.render("urls_new",templateVars);
    return;
  }
  res.redirect("/login");
  return;
});

app.get('/login',(req,res) => {
  let templateVars = {user: users[req.session.user_id]};
  res.render('login',templateVars);
})

app.get("/urls/:id", (req, res) => {
  var user = req.session.user_id;
  var longURL = '';
  if(user){
    for(var i in urlDatabase[user]){
      const shortURL = Object.keys(urlDatabase[user][i])[0];
      if(shortURL == req.params.id){
        longURL = urlDatabase[user][i][shortURL];
        let templateVars = { shortURL: req.params.id,longURL: longURL,user: users[req.session.user_id]};
        res.render("urls_show", templateVars);
      }/*else{res.end("Not in Database.")};*/
    }
  }else{res.end("Please Login.");}
});

app.post('/register',(req,res) => {
  if(req.body.email && req.body.password){
    for(var entry in users){
      if(users[entry]['email'] == String(req.body.email)){
        res.statusCode = 400;
        res.end("Email address Exists.");
        return;
      }
    }
  }else if((!(req.body.email)) || (!(req.body.password))){
    res.statusCode = 400;
    res.end("Please provide email and password");
    return;
  }
  let userEmail = req.body.email;
  let userPassword = bcrypt.hashSync(req.body.password,10);
  let userId = generateRandomString();
  users[userId] = {id:userId,email:String(userEmail),password:String(userPassword)};
  req.session.user_id = userId;
  res.redirect("/urls");
  return;

})

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let userIdentity = req.session.user_id;
    if(users[userIdentity]){
      for(var i in urlDatabase[userIdentity]){
        if(Object.keys(urlDatabase[userIdentity][i])[0] == shortURL){
          const newUrl = req.body.longURL;
          urlDatabase[userIdentity][i][shortURL] = newUrl;
          res.redirect("/urls");
          return;
        }
      }
    }
  return;
});


app.post("/urls", (req, res) => {
  var randomKey = generateRandomString();
  var newUrl = {}
  var userKey = req.session.user_id;
  newUrl[randomKey] = req.body.longURL;
  if(urlDatabase[userKey] == undefined){
    urlDatabase[userKey] = [newUrl];
  }else{
    urlDatabase[userKey].push(newUrl);
  }
  res.redirect(`/urls/${randomKey}`);
  return;
});

app.get("/u/:shortURL", (req, res) => {
  let userId = req.session.user_id;
  let arr = urlDatabase[userId];
  var getUrl = [getUrl,urlList(urlDatabase)];
  for(var elem in getUrl){
    var obj = [].concat.apply([], getUrl[elem])
    for(var index in obj){
      if(Object.keys(obj[index]) == req.params.shortURL){
        let longURL = obj[index][req.params.shortURL];
        console.log(longURL);
        res.redirect(longURL);
        return;
      }/*else{res.end("Invalid ShortURL.");
        return;}*/
    }
  }
});

app.post("/urls/:id/delete",(req,res) => {
  let varToDelete = req.params.id;
  let userIdentity = req.session.user_id;
  if(users[userIdentity]){
    for(var url in urlDatabase[userIdentity]){
      if(Object.keys(urlDatabase[userIdentity][url]) == varToDelete){
          delete urlDatabase[userIdentity][url];
          res.redirect("/urls");
          return;
      }
    }
  }
});

app.post("/login", (req, res) => {
  let givenEmail = req.body.email;
  let givenPassword = req.body.password;
  for(var i in users){
    if((users[i].email == givenEmail) && (bcrypt.compareSync(givenPassword,users[i].password))){
      req.session.user_id = users[i].id;
      res.redirect('/');
      return;
      }else if (users[i].email == givenEmail ){
        res.status(403).send("Wrong password");
        return;
      }
  }
  res.status(403).send("Wrong email and password");
  return;
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
  return;
});


function generateRandomString() {
  var strArray = [];
  var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  var number = '0123456789'.split('');
  for(let i = 0; i < 6 ; i++){
    randomPick = parseInt(Math.random()*2);
    randomNumberGenAlpha = parseInt(Math.random()*52) - 1;
    randomNumberGenNum = parseInt(Math.random()*10) - 1;
    if(randomPick == 0 ){
      strArray.push(alphabet[randomNumberGenAlpha]);
    }else{
      strArray.push(number[randomNumberGenNum]);
    }
  }
  return strArray.join('');
}
