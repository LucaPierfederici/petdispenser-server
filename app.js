/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/



var express = require('express')
var bodyParser = require('body-parser')
var awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const sql = require("./db.config.js");

// declare a new express app
var app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});


/**********************
 * Example get method *
 **********************/

app.get('/checktoken', function(req, res) {
  // Add your code here
  sql.query("SELECT * from dieta", (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("users: ", result);
    res.json({success: true, result});
    return;
  });
  //res.json({success: 'get call succeed!', url: req.url});
});

app.get('/animals', function(req, res) {
  // check if token is valid
  const userId = "uje3LNinlBQRKKnT55Do95tDdPp1";
  sql.query(`SELECT * from animale where id_google_utente='${userId}'`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("users: ", result);
    res.json({success: true, result});
    return;
  });
});

app.get('/animals/:id', function(req, res) {
  // check if token is valid
  const userId = "123";
  const {id} = req.params;
  sql.query(`SELECT * from animale where _id='${id}' LIMIT 1`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err})
      return;
    }

    if (!result.length) {
      console.log("error: ", err);
      res.json({success: false, error: "Animal not found"});
      return;
    }

    console.log("animalID: ", result);
    res.json({success: true, result: result[0]});
    return;
  });
});

app.post('/animals', function(req, res) {
  // check if token is valid
  const userId = "123";
  const {id} = req.params;

  const newAnimal = req.body;
  console.log("newAnimal: ", newAnimal);

  sql.query("INSERT INTO animale SET ?", newAnimal, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("animal: ", result);
    res.json({success: true, result});
    return;
  });
});

app.put('/animals/:id', function(req, res) {
  // check if token is valid
  const userId = "123";
  const {id} = req.params;

  const newAnimal = req.body;

  sql.query("UPDATE animale SET nome_animale = ?, path = ?, tipologia = ?, razza = ?, peso = ?, ddn = ? WHERE _id = ?", [
    newAnimal.nome_animale, newAnimal.path, newAnimal.tipologia, newAnimal.razza, newAnimal.peso, newAnimal.ddn, id
  ], (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("animal: ", result);
    res.json({success: true, result});
    return;
  });
});

app.delete('/animals/:id', function(req, res) {
  // check if token is valid
  const userId = "123";
  const {id} = req.params;

  const newAnimal = req.body;

  sql.query("DELETE FROM animale WHERE _id = ?", id, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("animal: ", result);
    res.json({success: true, result});
    return;
  });
});

app.get('/meals', function(req, res) {
  // check if token is valid
  const userId = "uje3LNinlBQRKKnT55Do95tDdPp1";
  const filters = [];

  Object.keys(req.query).forEach((key) => {
    switch (key) {
      case 'date':
        if(req.query[key])
          filters.push(`AND data = '${req.query[key]}'`);
        break;
      default:
        break;
    }
  });
  const q = `SELECT * from pasto WHERE id_google_utente='${userId}' ${filters.join(" ")} order by ora ASC`;
  console.log("QUERY",q);
  sql.query(q, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("meals: ", result);
    res.json({success: true, result});
    return;
  });
});

app.get('/meals/:id', function(req, res) {
  // check if token is valid
  const userId = "123";
  const {id} = req.params;
  sql.query(`SELECT * from pasto where _id='${id}' LIMIT 1`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err})
      return;
    }

    if (!result.length) {
      console.log("error: ", err);
      res.json({success: false, error: "Meal not found"});
      return;
    }

    console.log("mealID: ", result);
    res.json({success: true, result: result[0]});
    return;
  });
});

app.post('/meals', function(req, res) {
  // check if token is valid
  const userId = "123";
  const {id} = req.params;

  const newMeal = req.body;
  console.log("newMeal: ", newMeal);

  sql.query("INSERT INTO pasto SET ?", newMeal, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("meal: ", result);
    res.json({success: true, result});
    return;
  });
});

app.put('/meals/:id', function(req, res) {
  // check if token is valid
  const userId = "123";
  const {id} = req.params;

  const newMeal = req.body;

  sql.query("UPDATE pasto SET nome = ?, quantita_croccantini = ?, quantita_umido = ?, note = ?, pasto_dieta_id = ?, data = ?, ora = ? WHERE _id = ?", [
    newMeal.nome, newMeal.quantita_croccantini, newMeal.quantita_umido, newMeal.note, newMeal.pasto_dieta_id, newMeal.data, newMeal.ora, id
  ], (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("meal: ", result);
    res.json({success: true, result});
    return;
  });
});

app.delete('/meals/:id', function(req, res) {
  // check if token is valid
  const userId = "123";
  const {id} = req.params;

  const newAnimal = req.body;

  sql.query("DELETE FROM pasto WHERE _id = ?", id, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("meal: ", result);
    res.json({success: true, result});
    return;
  });
});

app.get('/item/*', function(req, res) {
  // Add your code here
  res.json({success: 'get call succeed!', url: req.url});
});

/****************************
* Example post method *
****************************/

app.post('/item', function(req, res) {
  // Add your code here
  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

app.post('/item/*', function(req, res) {
  // Add your code here
  res.json({success: 'post call succeed!', url: req.url, body: req.body})
});

/****************************
* Example put method *
****************************/

app.put('/item', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

app.put('/item/*', function(req, res) {
  // Add your code here
  res.json({success: 'put call succeed!', url: req.url, body: req.body})
});

/****************************
* Example delete method *
****************************/

app.delete('/item', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.delete('/item/*', function(req, res) {
  // Add your code here
  res.json({success: 'delete call succeed!', url: req.url});
});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
