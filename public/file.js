$(document).ready(function(){

  $('#create').on('click', function(){

      var name = $('#name');
      var file = {name: name.val()};

      $.ajax({
        type: 'POST',
        url: '/',
        data: file,
        success: function(data){
          if(data['success']) location.reload();
          else alert('File name already exists!');
        }
      });

      return false;

  });



  /*$('#rem').on('click', function(event) {
    event.preventDefault();
    var rem = $("#todo input");
    var dtask = {name: rem.val()};
    alert(dtask);
    $.ajax({
       type:'POST',
       url:'/del',
       //contentType: "application/json; charset=UTF-8",
       //dataType: "json",
       data: dtask,
       //success:function(data){
      //    location.reload();
       //}
     });
   });
*/
});
