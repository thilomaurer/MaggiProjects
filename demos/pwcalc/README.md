Password Calculator
===================

This application calculates **strong passwords for each alias from your single secret**.

* No need to remember dozens of passwords any longer.
* No need for a password manager any longer.
* Full freedom in choosing aliases and secret, e.g.
  * alias: `username@google.com#2014`
  * secret: `safe⚿in漢字`

The following hash method is used:

* simple [SHA1](https://en.wikipedia.org/wiki/SHA-1) (default for upgraders)  
  The formula is `"[secret][alias]" → SHA1 →  BASE64`
