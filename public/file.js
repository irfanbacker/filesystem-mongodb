var socket = io("http://localhost:3000/");
let currDir=[];
let files=[];
let mode='Normal';

//-------------------------------------------------------------------------------------------------------------------------

function chMode(){
  if(mode=='Normal'){
    mode='Delete';
  }
  else{
    mode='Normal';
  }
  $("#mode").html(mode);
}

function getFile(name){
  var file;
  for(let i=0;i<files.length;i++){
    if(files[i].name==name) {
      file=files[i];
      break;
    }
  }
  return file;
}

function clickDir(name){
  file=getFile(name);
  if(mode=='Normal'){
    if(file.type==false){
      alert('Edit file: '+file.name);
    }
    else{
      var fdir=file.dir;
      fdir.push(file.name);
      //console.log(fdir);
      currDir=fdir;
      socket.emit('changedir', fdir);
    }
  }
  else if(mode=='Delete'){
    var c=confirm("Confirm deletion of File/Folder");
    if(c==true){
      if(file.type==false){
        socket.emit('deletefile', file);
      }
      else{
        socket.emit('deletefolder', file);
      }
    }
  }
}

function updatelist() {
  var cdir;
  var l=files.length;
  $("#files").empty();
  if(files.length!=0){
    for(let i=0;i<l;i++){
      if(files[i].type==false){
        $('#files').append('<a href="#" onclick="clickDir(\''+files[i].name+'\');return false;"><img border="0" alt="file" src="/images/file.png" width="90" height="90"><div class="text" align="center">'+files[i].name+'</div></a>&emsp;');
      }
      else{
        $('#files').append('<a href="#" onclick="clickDir(\''+files[i].name+'\');return false;"><img border="0" alt="folder" src="/images/folder.png" width="90" height="90"><div class="text" align="center">'+files[i].name+'</div></a>&emsp;');
      }
    }
  }
  else{
    $('#files').append('There are no files/folders in this directory');
  }
}

function checkFname(name){
  var f=true;
  for(let i=0;i<files.length;i++){
    if(files[i].name==name){
      f=false;
    }
  }
  return f;
}

function newFolder(){
  var foldername = prompt("Enter new folder name", "New Folder");
  if(foldername!=null){
    var check=checkFname(foldername);
    if (check==true) {
        socket.emit('newfolder', {name:foldername, dir:currDir});
    }
    else{
      alert('Folder/File name already exists!');
    }
  }
}

function newFile(){
  var filename = prompt("Enter new file name", "New File");
  if(filename!=null){
    var check=checkFname(filename);
    if (check==true) {
        socket.emit('newfile', {name:filename, dir:currDir});
    }
    else{
      alert('Folder/File name already exists!');
    }
  }
}

function backDir(){
  currDir.pop();
  socket.emit('changedir', currDir);
}

function back(lvl){
  for(let i=currDir.length-1;i>lvl;i--){
    currDir.pop();
  }
  socket.emit('changedir', currDir);
}

//-------------------------------------------------------------------------------------------------------------------------

socket.on('connect', () => {

  socket.on('changedir', function(dbfiles){
    files=dbfiles;
    if(currDir.length==0){
      $('#back').hide();
    }
    else{
      $('#back').show();
    }
    $('#files').empty();
    updatelist();
    $("#dirl").empty();
    if(currDir.length==0) $('#dirl').append('<li>/  Root</li>');
    else $('#dirl').append('<li><a href="#" onclick="back(-1);return false;">/  Root</a></li>');
    for(let i=0;i<currDir.length-1;i++){
      $('#dirl').append('<li><a href="#" onclick="back('+i+');return false;">'+currDir[i]+'</a></li>');
    }
    if(currDir.length>0) $('#dirl').append('<li>'+currDir[currDir.length-1]+'</li>');
    console.log(files);
    console.log('Directory refreshed/Changed');
  })

});

socket.on('disconnect', () => {
  location.reload();
});
