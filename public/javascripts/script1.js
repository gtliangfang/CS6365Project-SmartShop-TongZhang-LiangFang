$(function() {
  var output = [];
  $.getJSON("output.json", function(data) {
      $.each(data.output, function(i, f) {
        // var id = "#"+f.cashback.cName.toLowerCase();
        //alert(f.cashback.cLink);
        var tblRow1 = "<tr class='fancy' name='" + f.cashback.cName + "'><td>" + f.sellerName + "</td><td>" +f.rating+"</td><td>"+f.details+"</td></tr>";
        $(tblRow1).appendTo("#tbRetailer tbody");
        var tblRow2 = "<tr class='fancy' name='" + f.cashback.cName + "'><td>" + f.cashback.cName + "</td><td>"+f.cashback.cDiscount+"</td>"+ "<td><a href='"+f.cashback.cLink+"'>Link</a></td>"+"</tr>";
        $(tblRow2).appendTo("#tbCashback tbody");
        var tblRow3 = "<tr class='fancy' name='" + f.cashback.cName + "'><td>" + f.giftCard.gName + "</td><td>"+f.giftCard.gDiscount+"</td>"+ "<td><a href='"+f.giftCard.gLink+"'>Link</a></td>"+"</tr>";
        $(tblRow3).appendTo("#tbGifttCard tbody");
        var tblRow4 = "<tr class='fancy' name='" + f.cashback.cName + "'><td>" + f.originalPrice+"</td><td>" + f.saving.priceWithCashback+"</td><td>" + f.saving.priceWithGiftCard+"</td><td>" +f.saving.priceWithBoth + "</td></tr>";
        $(tblRow4).appendTo("#tbPrice tbody");
        var tblRow5 = "<tr class='fancy' name='" + f.cashback.cName + "'><td>" + f.coupon + "</td></tr>";
        $(tblRow5).appendTo("#tbCoupon tbody");
      //}
    });
  });
});