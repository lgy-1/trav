const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
// Create MySQL connection
const connection = mysql.createConnection({
    host: 'db4.com',
    user: 'lgy1234',
    password: 'Lim12345',
    database: 'trav'
});

const storage = multer.diskStorage({
    destination: (req,file,cb) =>{
      cb(null, 'public/images');
    },
    filename:(req,file,cb) => {
      cb(null,file.originalname);
    }
  });
  
const upload = multer({storage:storage})

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});
// Set up view engine
app.set('view engine', 'ejs');
// enable static files
app.use(express.static('public'));
//enable form processing
app.use(express.urlencoded({
    extended:false
}));
// Define routes
// Example:


//Get the country cards
app.get('/', (req, res) => {
  const  sql = 'SELECT * FROM country';
  connection.query(sql, (error, results) => {
      if (error) throw error;
      res.render('countries', {country: results }); 
  });
});

//Get each country by ID 
app.get('/country/:id', (req, res) => {
    
    const countryid = req.params.id;
    
    const countrySql = 'SELECT * FROM country WHERE countryId = ?';
    const attractionsSql = 'SELECT * FROM attraction WHERE countryId = ?';
    
    connection.query(countrySql, [countryid], (error, countryResults) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving country by ID');
        }
        
        if (countryResults.length === 0) {
            return res.status(404).send('Country not found');
        }
        
        connection.query(attractionsSql, [countryid], (attractionsError, attractionsResults) => {
            if (attractionsError) {
                console.error('Database query error:', attractionsError.message);
                return res.status(500).send('Error retrieving attractions');
            }
            
            res.render('country', { country: countryResults[0], attraction: attractionsResults });
        });
    });
  });

//Get itinerary page shows all added itinerary
  app.get('/itinerary', (req, res) => {
    const sql = 'SELECT * FROM country';
    connection.query(sql, (error, countriesResults) => {
        if (error) throw error;
  
        // Query attractions separately
        const sqlAttractions = 'SELECT * FROM attraction';
        connection.query(sqlAttractions, (error, attractionsResults) => {
            if (error) throw error;
            
            const sqlAttractions = 'SELECT * FROM iti';
            connection.query(sqlAttractions, (error, itiResults) => {
            if (error) throw error;

            // Render HTML page with both countries and attractions data
            res.render('index', { country: countriesResults, attractions: attractionsResults , iti:itiResults });
            });
        });
    });
  });

  //Get itinerary by ID 
  app.get('/itinerary/:id', (req, res) => {
    // Extract the itinerary ID from the request parameters
    const itiId = req.params.id;
    const itiSql = 'SELECT * FROM iti WHERE itiID = ?';
    const daysSql = 'SELECT * FROM days WHERE itiID = ?';

    // Fetch itinerary data from MySQL based on the itinerary ID
    connection.query(itiSql, [itiId], (itiError, itiResults) => {
        if (itiError) {
            console.error('Database query error:', itiError.message);
            return res.status(500).send('Error retrieving itinerary by ID');
        }

        // Check if any itinerary with the given ID was found
        if (itiResults.length > 0) {
            // Fetch days data for the given itinerary ID
            connection.query(daysSql, [itiId], (daysError, daysResults) => {
                if (daysError) {
                    console.error('Database query error:', daysError.message);
                    return res.status(500).send('Error retrieving days for itinerary');
                }

                // Render HTML page with the itinerary and days data
                res.render('itinerary', { iti: itiResults[0], days: daysResults });
            });
        } else {
            // If no itinerary with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Itinerary not found');
        }
    });
});


//get additinerary
  app.get('/additi', (req, res) => {
    res.render('additi');
  });
  

  app.post('/additi',(req, res) => {
    // Extract student data from the request body
    const {destination,start,budget,end}= req.body;
    const sql = 'INSERT INTO iti (destination,start,budget,end) VALUES (?, ?, ?,?)';
    
    // Insert the new student into the database
    connection.query(sql, [destination,start,budget ,end], (error, results) => {
      if (error) {
        // Handle any error that occurs during the database operation
        console.error('Error adding itinerary:', error);
        res.status(500).send('Error adding itinerary');
      } else {
        // Send a success response
        res.redirect('/');
      }
    });
  });

  app.get('/editItinerary/:id', (req,res) => {
    const itiID = req.params.id;
    const sql = 'SELECT * FROM iti WHERE itiID = ?';
    // Fetch data from MySQL based on the product ID
    connection.query( sql , [itiID], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving itinerary by ID');
        }
        // Check if any product with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the product data
            res.render('editItinerary', { iti: results[0] });
        } else {
            // If no product with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('itinerary not found');
        }
    });
});

app.post('/editItinerary/:id', upload.single('image'),(req, res) => {
  const itiID = req.params.id;
  // Extract product data from the request body
  const { destination, start, budget,end} = req.body;
  const sql = 'UPDATE iti SET destination = ?, start = ?, budget = ? , end =? WHERE itiID = ?';

  // Insert the new product into the database
  connection.query(sql, [destination, start, budget, end, itiID], (error, results) => {
      if (error) {
          // Handle any error that occurs during the database operation
          console.error("Error updating itinerary:", error);
          res.status(500).send('Error updating itinerary');
      } else {
          // Send a success response
          res.redirect('/itinerary');
      }
  });
});

  app.get('/deleteItinerary/:id',(req,res) =>{
    const itiId = req.params.id;
    const sql = 'DELETE FROM iti WHERE itiID =?';
    connection.query(sql,[itiId],(error,results)=>{
      if (error){
        console.error('Error deleting itinerary:',error);
        res.status(500).send('Error deleting itinerary');
      } else {
        res.redirect('/itinerary')
      }
    });
  });
  
  app.get('/addDay', (req, res) => {
    const { itiID } = req.query;
    res.render('addDay', { itiID });
  });
  
  
  app.post('/addDay', (req, res) => {
    const { time, attraction, day, itiID , cost } = req.body;
    const sql = 'INSERT INTO days (time, attraction, day, itiID ,cost) VALUES (?, ?, ?, ? , ?)';
    
    connection.query(sql, [time, attraction, day, itiID , cost], (error, results) => {
      if (error) {
        console.error('Error adding itinerary:', error);
        res.status(500).send('Error adding itinerary');
      } else {
        res.redirect('/itinerary');
      }
    });
  });
  
  
  app.get('/deleteDay/:id',(req,res) =>{
    const dayID = req.params.id;
    const sql = 'DELETE FROM days WHERE dayID =?';
    connection.query(sql,[dayID],(error,results)=>{
      if (error){
        console.error('Error deleting itinerary:',error);
        res.status(500).send('Error deleting itinerary');
      } else {
        res.redirect('/itinerary')
      }
    });
  });

 

app.get('/editDay/:id', (req,res) => {
  const dayID = req.params.id;
  const sql = 'SELECT * FROM days WHERE dayID = ?';
  // Fetch data from MySQL based on the product ID
  connection.query( sql , [dayID], (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error retrieving day by ID');
      }
      // Check if any product with the given ID was found
      if (results.length > 0) {
          // Render HTML page with the product data
          res.render('editDay', { day: results[0] });
      } else {
          // If no product with the given ID was found, render a 404 page or handle it accordingly
          res.status(404).send('Day not found');
      }
  });
});

app.post('/editDay/:id', upload.single('image'), (req, res) => {
  const dayID = req.params.id;
  // Extract product data from the request body
  const { time, attraction, itiID, day, cost } = req.body;
  const sql = 'UPDATE days SET time = ?, attraction = ?, itiID = ?, day = ?, cost = ? WHERE dayID = ?';

  // Insert the new product into the database
  connection.query(sql, [time, attraction, itiID, day, cost, dayID], (error, results) => {
      if (error) {
          // Handle any error that occurs during the database operation
          console.error("Error updating itinerary:", error);
          res.status(500).send('Error updating itinerary');
      } else {
          // Send a success response
          res.redirect('/itinerary');
      }
  });
});

app.get('/addAttraction', (req, res) => {
  const { countryId } = req.query;
  res.render('addAttraction', { countryId });
});

app.post('/addAttraction', upload.single('image'), (req, res) => {
  // Extract attraction data from the request body
  const { attractionName, price, rating, countryId ,des} = req.body;
  let attractionImage;
  
  if (req.file) {
    attractionImage = req.file.filename;
  } else {
    attractionImage = null;
  }
  
  const sql = 'INSERT INTO attraction (attractionName, price, rating, attractionImage, countryId ,des) VALUES (?, ?, ?, ?, ? ,?)';
  
  // Insert the new attraction into the database
  connection.query(sql, [attractionName, price, rating, attractionImage, countryId ,des], (error, results) => {
    if (error) {
      // Handle any error that occurs during the database operation
      console.error('Error adding attraction:', error);
      res.status(500).send('Error adding attraction');
    } else {
      // Send a success response
      res.redirect('/');
    }
  });
});

app.get('/deleteAttraction/:id',(req,res) =>{
  const attractionId = req.params.id;
  const sql = 'DELETE FROM attraction WHERE attractionId =?';
  connection.query(sql,[attractionId],(error,results)=>{
    if (error){
      console.error('Error deleting attraction:',error);
      res.status(500).send('Error deleting attraction');
    } else {
      res.redirect('/')
    }
  });
});

app.get('/editAttraction/:id', (req,res) => {
  const attractionId = req.params.id;
  const sql = 'SELECT * FROM attraction WHERE attractionId = ?';
  // Fetch data from MySQL based on the product ID
  connection.query( sql , [attractionId], (error, results) => {
      if (error) {
          console.error('Database query error:', error.message);
          return res.status(500).send('Error retrieving attraction by ID');
      }
      // Check if any product with the given ID was found
      if (results.length > 0) {
          // Render HTML page with the product data
          res.render('editAttraction', { attraction: results[0] });
      } else {
          // If no product with the given ID was found, render a 404 page or handle it accordingly
          res.status(404).send('Product not found');
      }
  });
});

app.post('/editAttraction/:id', upload.single('image'), (req, res) => {
  // Route handling code here
const attractionId = req.params.id;
// Extract product data from the request body
const { attractionName, price, des , rating , countryId} = req.body;
let attractionImage = req.body.currentImage
if (req.file){
  attractionImage = req.file.filename;
}
const sql = 'UPDATE attraction SET attractionName= ?, price = ?, des = ? , rating =? , countryId =? , attractionImage = ? WHERE attractionId = ?';

// Insert the new product into the database
connection.query(sql, [ attractionName, price, des , rating , countryId , attractionImage , attractionId], (error, results) => {
    if (error) {
        // Handle any error that occurs during the database operation
        console.error("Error updating attraction:", error);
        res.status(500).send('Error updating attraction');
    } else {
        // Send a success response
        res.redirect('/');
    }
});
});


  
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port:${PORT}`));