const express  = require("express");
const app = express();

var socket=require("socket.io");

var port=3000;

var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

app.use(express.static('public'));

//------------------------------------------------------------------------------

mongoose.connect('mongodb://localhost:27017/filemanager',{ useNewUrlParser: true , useUnifiedTopology: true});

var db = mongoose.connection;

db.on('error',function(){
   console.log('\nMongoDB Connection Error. Please make sure that MongoDB is running\n');
   process.exit();
});

//---------------------File type: 0=Text file and 1=Folder-----------------------
var crdtSchema = mongoose.Schema({name: String, type: Boolean, dir:Array, crdt:Array});

// compile schema to model
var file = mongoose.model('file', crdtSchema);

db.once('open', function() {
    console.log("Database connection Successful!");
});
//-------------------------------------------------------------------------------

function getFiles(dir){
  var currfiles=[];
  file.find({dir:dir},function (err, results) {
    for(let i=0;i<results.length;i++){
      currfiles.push({oid:results[i]._id, name:results[i].name, type:results[i].type, dir:results[i].dir});
    }
    // console.log('Files fetched:');
    // console.log(currfiles);
    // return currfiles;
  });
  console.log('Files fetched:');
  console.log(currfiles);
  return currfiles;
}

function delFolder(folder,cdir,currsocket){
  file.deleteOne(folder, function (err, result) {
    if (err) {
      console.log("error query");
    } else {
      if(cdir==folder.dir){
        var tdir=cdir;
        tdir.pop();
        file.find({dir:tdir},function (err, results) {
          var files=[];
          for(let i=0;i<results.length;i++){
            files.push({oid:results[i]._id, name:results[i].name, type:results[i].type, dir:results[i].dir});
          }
          //console.log('folderdel:');
          //console.log(files);
          currsocket.emit("changedir", files);
        });
      }
      console.log(result);
    }
  });
  var ndir=folder.dir;
  ndir.push(folder.name);
  file.find({dir:ndir},function (err, results) {
    for(let j=0;j<results.length;j++){
      if(results[j].type==false){
        delFile(results[j]._id);
        //console.log('delFile');
      }
      else{
        delFolder(results[j],cdir,currsocket);
        //console.log('delFolder');
      }
    }
  });
}

function delFile(oid){
  file.deleteOne({_id:oid}, function (err, result) {
    if (err) {
      console.log("error query");
    } else {
      console.log(result);
    }
  });
}

//-------------------------------------------------------------------------------

const listener = app.listen(port,function() {
  console.log("Your app is listening on port " + port);
});

const io = socket(listener);

//-------------------------------------------------------------------------------
io.on("connection", function(socket) {
  file.find(function (err, results) {
      var files=[];
      for(let i=0;i<results.length;i++){
        if(results[i].dir.length==0){
          files.push({oid:results[i]._id, name:results[i].name, type:results[i].type, dir:results[i].dir});
        }
      }
      console.log('Files fetched:');
      console.log(files);
      console.log(socket.id+" has connected to FS");
      socket.emit("changedir", files);
  });

  //console.log('Files fetched:\n'+files+'\n');
  socket.on('changedir', function(data){
    file.find({dir:data},function (err, results) {
        var files=[];
        for(let i=0;i<results.length;i++){
          files.push({oid:results[i]._id, name:results[i].name, type:results[i].type, dir:results[i].dir});
        }
        console.log('Files fetched:');
        console.log(files);
        socket.emit("changedir", files);
    });
    console.log("Directory refreshed/changed");
  });

  socket.on('newfolder', function(data){
    var newfolder = new file({name:data.name, type:true, dir:data.dir, crdt:[]});
    var promise = newfolder.save();
    promise.then(function(){
      file.find({dir:data.dir},function (err, results) {
          var files=[];
          for(let i=0;i<results.length;i++){
            files.push({oid:results[i]._id, name:results[i].name, type:results[i].type, dir:results[i].dir});
          }
          console.log('Files fetched:');
          console.log(files);
          socket.emit("changedir", files);
      });
      console.log("New folder '"+data.name+"' created!");
    });
  });

  socket.on('newfile', function(data){
    var newfile = new file({name:data.name, type:false, dir:data.dir, crdt:[]});
    var promise = newfile.save();
    promise.then(function(){
      file.find({dir:data.dir},function (err, results) {
          var files=[];
          for(let i=0;i<results.length;i++){
            files.push({oid:results[i]._id, name:results[i].name, type:results[i].type, dir:results[i].dir});
          }
          console.log('Files fetched:');
          console.log(files);
          socket.emit("changedir", files);
      });
      console.log("New file '"+data.name+"' created!");
    });
  });

  socket.on('deletefile', function(data){
    file.deleteOne({_id:data.oid}, function (err, result) {
      if (err) {
        console.log("error query");
      } else {
        file.find({dir:data.dir},function (err, results) {
          var files=[];
          for(let i=0;i<results.length;i++){
            files.push({oid:results[i]._id, name:results[i].name, type:results[i].type, dir:results[i].dir});
          }
          socket.emit("changedir", files);
        });
        console.log(result);
      }
    });
    console.log("File '"+data.name+"' is deleted!");
  });

  socket.on('deletefolder', function(data){
    file.find({_id:data.oid},function (err, results) {
      if(err){}
      else{
        delFolder(results[0],results[0].dir,socket);
      }
    });
    console.log("Folder '"+data.name+"' and it's contents are deleted!");
  });

});

//-------------------------------------------------------------------------------

app.get('/', function(req, res){
    res.sendFile(__dirname + "/views/home.html");
});

//-------------------------------------------------------------------------------
