$(document).ready(function(){
  $('#amount').bind('keyup', function(){
    $('#stripe').html("");
    $('iframe').remove();
    $('#stripe').append($('<form id="stripe" action="/t/'+$('#team-name').text()+'/charge" method="POST"><script src="https://checkout.stripe.com/checkout.js" class="stripe-button" data-key="pk_test_Ia54eQ8AhcwvO2CQnUJSWy1w" data-amount="'+100*$(this).val()+'" data-name="Penny War" data-description="Charity"data-image="/static/img/penny.jpg"></script><input value="'+100*parseInt($(this).val())+'" name="price" style="display:none;"></form>'));
  });
});
