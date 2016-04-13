$(document).ready(function() {
  
  $('table').on('click', 'button.edt', function() {
    var btn = $(this),
        btns = $('button'),
        newRow = '<tr class="edit"><td colspan="6"><input type="text" required pattern="[0-9]{1,2}-[0-9]{1,2}" placeholder="XX-XX" /><button class="btn btn-success sbm">Submit</button><span id="msg"></span></td></tr>';

    if (btn.text() == 'Cancel') {
      $('tr.edit').remove();
      btns.html('&#9998; Edit');
    } else {
      $('tr.edit').remove();
      btns.html('&#9998; Edit');
      btn.parent().parent().after(newRow);
      btn.text('Cancel');
    }
  })

  $('table').on('click', 'button.sbm', function() {
    var btn   = $(this),
        score = btn.prev().val(),
        mid   = btn.parent().parent().prev().data('mid');
    
    if (score.match(/[0-9]{1,2}-[0-9]{1,2}/)) {
      $.post('/matches/result', { mid: mid, score: score })
        .done(function(res) {
          location.reload();
        })
        .fail(function() {
          $('#msg').text('Couldn\'t update result');
        })
        .always(function() {

        })
    } else {
      $('#msg').text('Please enter a correctly-formatted result');
    }
  })

  $('table').on('focus', 'input', function() {
    $('#msg').empty();
  });


})