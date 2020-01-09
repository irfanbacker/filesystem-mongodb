const express  = require("express");
const app = express();

var port=3000;

var mongoose = require('mongoose');

var bodyParser = require('body-parser');
app.set('view engine', 'ejs');
app.use(express.static('./public'));
var urlencodedParser = bodyParser.urlencoded({extended: false});

//------------------------------------------------------------------------------

mongoose.connect('mongodb://localhost:27017/textfiles',{ useNewUrlParser: true , useUnifiedTopology: true});

var db = mongoose.connection;

db.on('error',function(){
   console.log('\nMongoDB Connection Error. Please make sure that MongoDB is running\n');
   process.exit();
});

var files = [];

var crdtSchema = mongoose.Schema({name: String});

// compile schema to model
var file = mongoose.model('file', crdtSchema);

db.once('open', function() {
    console.log("Database connection Successful!");

    // define Schema
    /*var crdtSchema = mongoose.Schema({
      name: String,
      crdt: {}
    });*/

    file.find(function (err, results) {
        for(let i=0;i<results.length;i++){
          files.push({name:results[i].name});
        }
      });

});

//------------------------------------------------------------------------------

//=========================================================================

//file.find((err, filenames) => {
    // Note that this error doesn't mean nothing was found,
    // it means the database had an error while searching, hence the 500 status
//    if (err) return res.status(500).send(err)
    // send the list of all people
//    return res.status(200).send(people);
//});
//-------------------------------------------------------------------------

app.get('/', function(req, res){
    res.render('home', {files: files});
});

app.post('/', urlencodedParser, function(req, res){
    let f=0;
    var file1 = new file(req.body);
    for(let i=0;i<files.length;i++){
      if(files[i].name==file1.name) f=1;
    }
    if(f==0){
      files.push(req.body);
      file1.save(function (err, file) {
        if (err) return console.error(err);
        console.log(file.name + " saved to filenames");
      });
      res.jsonp({success : true});
    }
    else res.jsonp({success : false});
});

app.post('/del', urlencodedParser, function(req, res){
    var dfile = req.body.check;
    //var dtasks = ["Task2"]
    //tasks.splice(tasks.indexOf(dtasks), 1);
    var filtered = files.filter(function(value, index, arr){
       if (value.name==dfile) return 0;
       else return 1;
    });
    files=filtered;
    file.deleteOne({name:dfile}, function (err, result) {
       if (err) {
           console.log("error query");
       } else {
          console.log(result);
       }
    });
    console.log("Delete: "+dfile);
    res.redirect('/');
});

app.post('/edit', urlencodedParser, function(req, res){
    console.log("Edit: "+req.body.check);
    res.redirect('/');
});

//-------------------------------------------------------------------------

app.listen(port);
console.log('Server started at port ' + port);
