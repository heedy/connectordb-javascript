[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/connectordb/connectordb-javascript/blob/master/LICENSE) [![npm version](https://badge.fury.io/js/connectordb.svg)](https://badge.fury.io/js/connectordb)

# ConnectorDB Javascript Client
This is the official javascript client for ConnectorDB. It is compatible with node, react-native, and the browser.

## Installing
### node

```
npm install connectordb --save
```

### Browser
You can download one of the releases (release tabs).

### Building

```bash
git clone https://github.com/connectordb/connectordb-javascript
cd connectordb-javascript
npm install
npm script build
```

You can run node tests with:

```
npm script check
```

If making modifications, you can make sure your modifications work in the browser by using `browsertest.html`

## Usage
### Browser

```html
<html>
<head>
    <!-- You can also use requirejs -->
    <script src="connectordb.min.js"></script>
</head>
<body>
    <script>
        cdb = connectordb.ConnectorDB("apikey")

        // All functions return promises
        cdb.readUser("myuser").done(function(result) {
            console.log("User Nickname: " + result.name);
        });
    </script>
</body>
</html>
```

### Node/react-native

```javascript
connectordb = require("connectordb.min.js");

cdb = connectordb.ConnectorDB("apikey")

// All functions return promises
cdb.readUser("myuser").done(function(result) {
    console.log("User Nickname: " + result.name);
});
```
