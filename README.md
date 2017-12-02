Maggi Projects
==============

This package provides a web-IDE for [Maggi.js](https://github.com/thilomaurer/Maggi.js)

# Usage
In order to use Maggi Projects for your new application *myapp*, run
```bash
mkdir myapp && cd myapp
npm init myapp -y
npm install --save-dev maggi-projects
$(npm bin)/maggi-projects
```
Result:
```
SSL key pair created and saved.
Initializing new db 'Maggi.UI.IDE' from db/Maggi.UI.IDE.json
Loading db 'Maggi.UI.IDE' from db/Maggi.UI.IDE.json
Maggi Projects Server https://localhost:8443
```
Navigate to https://localhost:8443 to see the development environment.
