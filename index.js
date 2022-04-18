const fs = require('fs');
const twofactor = require("node-2fa");
var args = require('minimist')(process.argv.slice(2));
const express = require('express');
const crypto = require('crypto');
const base32 = require('hi-base32');
const cors = require('cors');
var http = require('http');
const { encrypt, decrypt } = require('./crypto');
const https = require('https');
const privateKeySSL  = fs.readFileSync('sslcert/server.key', 'utf8');
const certificateSSL = fs.readFileSync('sslcert/server.crt', 'utf8');
const credentials = {key: privateKeySSL, cert: certificateSSL};
//Must be a 32 length key
// Uses the PBKDF2 algorithm to stretch the string 's' to an arbitrary size,
// in a way that is completely deterministic yet impossible to guess without
// knowing the original string
function stretchString(s, outputLength) {
  var salt = crypto.randomBytes(16);
  return crypto.pbkdf2Sync(s, salt, 100000, outputLength, 'sha512');
}

// Stretches the password in order to generate a key (for encrypting)
// and a large salt (for hashing)
function keyFromPassword(password) {
  // We need 32 bytes for the key
  const keyPlusHashingSalt = stretchString(password, 32 + 16);
  return base32.encode('keyPlusHashingSalt');
}
if(typeof args.p === "undefined" || args.p === "" || args.p === null || typeof args.p == "boolean"){
  console.log("--- PLEASE ADD A MASTER PASSWORD WITH -p PARAM ---");
  process.exit(1)
}
const secretKey = keyFromPassword((args.p.toString()));

//console.log(secretKey)
let encryptedkeys = [];

function init_api(){
  var app = express();
  var bodyParser = require('body-parser');
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  var port = 3333;
  const router = express.Router();
  router.get('/', function(req, res) {
      let returnjson = [];
      for(let i of encryptedkeys){
        let totp = {};
        totp["key"] = twofactor.generateToken(decrypt(i,secretKey)).token;
        totp["url"] = i.url
        returnjson.push(totp);
      }
      res.json(returnjson);
  });
  app.use(cors({origin: '*'}));
  app.use('/api', router);
  var httpServer = http.createServer(app);
  var httpsServer = https.createServer(credentials, app);
  httpServer.listen((port-1));
  httpsServer.listen(port);
  console.log('HTTP port ' + (port-1));
  console.log('HTTPS port ' + port);
}
function init(){
  //First lets encrypt new data if available
  let encryptedata = fs.readFileSync('encrypted_TOTP.json');
  encryptedkeys = JSON.parse(encryptedata);
  let rawdata = fs.readFileSync('unencrypted_TOTP_secrets.json');
  let keys = JSON.parse(rawdata);
  if(Object.keys(keys).length > 0 ){
    for(let i of keys){
      let hash = encrypt(i.key,secretKey);
      hash["url"] = i.url
      encryptedkeys.push(hash);
    }
  }
  //Delete unencrypted TOTP
  fs.writeFileSync('unencrypted_TOTP_secrets.json', '[]');
  //Add encrypted TOTP
  fs.writeFileSync('encrypted_TOTP.json', JSON.stringify(encryptedkeys));
  return init_api();
}

return init();
