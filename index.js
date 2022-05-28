// server.js
// Для начала установим зависимости.
/*
const http = require('http');
const routing = require('./routing');


let server = new http.Server(function(req, res) {
  // API сервера будет принимать только POST-запросы и только JSON, так что записываем
  // всю нашу полученную информацию в переменную jsonString
  var jsonString = '';
  res.setHeader('Content-Type', 'application/json');
  req.on('data', (data) => { // Пришла информация - записали.
      jsonString += data;
  });

  req.on('end', () => {// Информации больше нет - передаём её дальше.
      routing.define(req, res, jsonString); // Функцию define мы ещё не создали.
  });
});
server.listen(8000, 'localhost');
*/

const express = require("express");
const app = express();
app.use(express.static(__dirname + "/public"));
 /*
app.use("/", function(request, response){
     
    response.send("<h1>Главная страница</h1>");
});
 */
app.listen(8000);
console.log('server2');