const express = require("express");
const app = express();
let port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("<h1>Emoji Catcher server v 1</h1>");
});

app.listen(port, () => {
    console.log('listening to port: ' + port);
})