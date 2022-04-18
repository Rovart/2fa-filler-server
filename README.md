# 2fa-filler-server
2FA API server to provide your 2FA codes to your devices locally. Please notice this version is alpha and under development.

> ⚠️ Disclaimer: Please note that this project involves a security tradeoff. I am by no means responsible for any security vulnerability derivated from this tool. Use it on your behalf.

## How to run

  - Install node and npm, execute ```npm install```
  - Install SSL certs to your API by executing:
    - ```mkdir sslcert```
    - ```sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./sslcert/selfsigned.key -out ./sslcert/selfsigned.crt```
  - Fill ```unencrypted_TOTP_secrets.json``` file by following the provided example with your 2FA private keys.
  > ⚠️ Your private keys will be removed and encrypted after executing the server.
  - Execute as sudo and set a password for encryption: ```sudo node index.js -p <password_to_encrypt>```

## Other information

  - SSL certs are required for https pages (most logins)
  - Password will probably change to be required only for encryption, decryption will probably work directly from the extension to improve the security
  - You can store multiple TOTP secrets under different passwords, similar to having multiple 2FA "vaults"
