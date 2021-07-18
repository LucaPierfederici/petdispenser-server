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
var admin = require("firebase-admin");
const serviceAccount = require('serviceAccount.json');

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

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

/**********************
 * Example get method *
 **********************/

async function verifyTokenCorrectness(idToken) {
    // idToken comes from the client app
    return admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            const uid = decodedToken.uid;
            return {
                uid, success: true
            };
        })
        .catch((error) => {
            return {
                error, success: false
            };
        });
}

app.get('/checktoken', async function(req, res) {
    // Add your code here
    const token = req.headers.authorization;
    if (!token) res.json({ success: false, error: 'tokenNotFound' });

    const oi = await verifyTokenCorrectness(token);
    res.json(oi);

});

app.get('/animals', async function (req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const filters = [];

  Object.keys(req.query).forEach((key) => {
    switch (key) {
      case 'name':
        if(req.query[key])
          filters.push(`AND nome = '${req.query[key]}'`);
        break;
      default:
        break;
    }
  });
  let query = `SELECT * from animale where id_google_utente='${userId}' ${filters.join(' ')}`;
  sql.query(query, (err, result) => {
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

app.get('/animals/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;
    sql.query(`SELECT * from animale where _id='${id}' and id_google_utente='${userId}' LIMIT 1`, (err, result) => {
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

app.post('/animals', async function(req, res) {
    const token = req.headers.authorization;
    if (!token) res.json({ success: false, error: 'tokenNotFound' });

    let tokenDecoded;
    try {
      tokenDecoded = await verifyTokenCorrectness(token);
    } catch(err) {
      res.json(err);
    }
    const userId = tokenDecoded.uid;
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

app.put('/animals/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

  const newAnimal = req.body;

    sql.query("UPDATE animale SET nome_animale = ?, path = ?, tipologia = ?, razza = ?, peso = ?, ddn = ? WHERE _id = ? and id_google_utente= ?", [
        newAnimal.nome_animale, newAnimal.path, newAnimal.tipologia, newAnimal.razza, newAnimal.peso, newAnimal.ddn, id, userId
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

app.delete('/animals/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

  const newAnimal = req.body;

    sql.query("DELETE FROM animale WHERE _id = ? and id_google_utente= ?", [id, userId], (err, result) => {
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

app.get('/animals/:id/diets', async function(req, res) {
 const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

  sql.query(`SELECT * from dieta where dieta_animale_id='${id}' AND id_google_utente='${userId}'`, (err, result) => {
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

app.get('/meals', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
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

app.get('/meals/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;
    sql.query(`SELECT * from pasto where _id='${id}' and id_google_utente='${userId}' LIMIT 1`, (err, result) => {
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

app.post('/meals', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
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

app.put('/meals/:id',async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

  const newMeal = req.body;

    sql.query("UPDATE pasto SET nome = ?, quantita_croccantini = ?, quantita_umido = ?, note = ?, pasto_dieta_id = ?, data = ?, ora = ? WHERE _id = ? and id_google_utente = ?", [
        newMeal.nome, newMeal.quantita_croccantini, newMeal.quantita_umido, newMeal.note, newMeal.pasto_dieta_id, newMeal.data, newMeal.ora, id, userId
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

app.delete('/meals/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

    sql.query("DELETE FROM pasto WHERE _id = ? and id_google_utente = ?", [id, userId], (err, result) => {
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

// *** DIET ******

app.get('/diets', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  sql.query(`SELECT * from dieta where id_google_utente='${userId}'`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("diets: ", result);
    res.json({success: true, result});
    return;
  });
});

app.get('/diets/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;
    sql.query(`SELECT * from dieta where _id='${id}' and id_google_utente='${userId}' LIMIT 1`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err})
      return;
    }

    if (!result.length) {
      console.log("error: ", err);
      res.json({success: false, error: "Diet not found"});
      return;
    }

    console.log("dietID: ", result);
    res.json({success: true, result: result[0]});

    return;
  });
});

app.get('/diets/last', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }

    const userId = tokenDecoded.uid;

    sql.query(`SELECT * from animale where _id = ? and id_google_utente = ?`, [newDiet.dieta_animale_id, userId], (err, result) => {
        if (err) {
            console.log("error: ", err);
            res.json({ success: false, error: err })
            return;
        }

        if (result.length == 0)
            res.json({ success: false, error: "user not authorized" })
    });


  sql.query(`SELECT * from dieta where id_google_utente='${userId}' ORDER BY _id DESC LIMIT 1`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err})
      return;
    }

    if (!result.length) {
      console.log("error: ", err);
      res.json({success: false, error: "Diet not found"});
      return;
    }

    console.log("dietID: ", result);
    res.json({success: true, result: result[0]});

    return;
  });
});

app.post('/diets', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;
  
  const newDiet = req.body;
    sql.query(`SELECT * from animale where _id = ? and id_google_utente = ?`, [newDiet.dieta_animale_id, userId], (err, result) => {
        if (err) {
            console.log("error: ", err);
            res.json({ success: false, error: err })
            return;
        }

        if (result.length == 0)
            res.json({ success:false,error:"user not authorized" })
    });



  sql.query("INSERT INTO dieta SET ?", newDiet, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("dietPost: ", result);
    res.json({success: true, result});
    return;
  });
});

app.put('/diets/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

    const newDiet = req.body;

    sql.query(`SELECT * from animale where _id = ? and id_google_utente = ?`, [newDiet.dieta_animale_id, userId], (err, result) => {
        if (err) {
            console.log("error: ", err);
            res.json({ success: false, error: err })
            return;
        }

        if (result.length == 0)
            res.json({ success: false, error: "user not authorized" })
    });

    sql.query("UPDATE dieta SET nome_dieta = ?, note = ?, dieta_attiva = ?, dieta_animale_id = ?, dieta_dispenser_id = ? WHERE _id = ? and id_google_utente = ?", [
        newDiet.nome_dieta, newDiet.note, newDiet.dieta_attiva, newDiet.dieta_animale_id, newDiet.dieta_dispenser_id, id, userId
  ], (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("dietPut: ", result);
    res.json({success: true, result});
    return;
  });
});

app.delete('/diets/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

    const newAnimal = req.body;

    sql.query(`SELECT * from animale where _id = ? and id_google_utente = ?`, [newDiet.dieta_animale_id, userId], (err, result) => {
        if (err) {
            console.log("error: ", err);
            res.json({ success: false, error: err })
            return;
        }

        if (result.length == 0)
            res.json({ success: false, error: "user not authorized" })
    });

    sql.query("DELETE FROM dieta WHERE _id = ? and id_google_utente = ?", [id, userId], (err, result) => {
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

app.get('/diets/:id/meal', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;
    sql.query(`select * from pasto where pasto_dieta_id='${id}' and id_google_utente='${userId}'`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err})
      return;
    }

    console.log("users: ", result);
    res.json({success: true, result});
    return;
  });
});

//++++++++++++ DISPENSER +++++++++++++++

app.get('/dispenser', async function(req, res) {
 const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const filters = [];

  Object.keys(req.query).forEach((key) => {
    switch (key) {
      case 'name':
        if(req.query[key])
          filters.push(`AND nome = '${req.query[key]}'`);
        break;
      default:
        break;
    }
  });
  let query = `SELECT * from dispenser where id_google_utente='${userId}' ${filters.join(' ')}`;

  sql.query(query, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("dispensers: ", result);
    res.json({success: true, result});
    return;
  });
});

app.get('/dispenser/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;
    sql.query(`SELECT * from dispenser where _id='${id}' and id_google_utente='${userId}'`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err})
      return;
    }

    console.log("dispenserID: ", result);
    res.json({success: true, result});
    return;
  });
});

app.post('/dispenser', async function(req, res) {
  // check if token is valid
  const userId = "uje3LNinlBQRKKnT55Do95tDdPp1";
  const {id} = req.params;

  const newDispenser = req.body;

  sql.query("INSERT INTO dispenser SET ?", newDispenser, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("dispenser: ", result);
    res.json({success: true, result});
    return;
  });
});

app.put('/dispenser/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

  const newDispenser = req.body;

    sql.query("UPDATE dispenser SET nome = ?, codice_bluetooth = ? WHERE _id = ? and and id_google_utente = ?", [
        newDispenser.nome, newDispenser.codice_bluetooth, id, userId
  ], (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("diet: ", result);
    res.json({success: true, result});
    return;
  });
});

app.delete('/dispenser/:id', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;

  const newAnimal = req.body;

    sql.query("DELETE FROM dispenser WHERE _id = ? and and id_google_utente = ?", id, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err});
      return;
    }

    console.log("dispenser: ", result);
    res.json({success: true, result});
    return;
  });
});

app.get('/dispenser/:id/diet', async function(req, res) {
  const token = req.headers.authorization;
  if (!token) res.json({ success: false, error: 'tokenNotFound' });

  let tokenDecoded;
  try {
    tokenDecoded = await verifyTokenCorrectness(token);
  } catch(err) {
      res.json(err);
      return;
  }
  
  const userId = tokenDecoded.uid;
  const {id} = req.params;
    sql.query(`select * from dieta where dieta_dispenser_id='${id}' and id_google_utente='${userId}' LIMIT 1`, (err, result) => {
    if (err) {
      console.log("error: ", err);
      res.json({success: false, error: err})
      return;
    }

    console.log("users: ", result);
    res.json({success: true, result});
    return;
  });
});

app.get('/item/*', async function(req, res) {
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
