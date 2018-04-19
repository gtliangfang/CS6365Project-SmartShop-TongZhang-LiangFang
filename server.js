var express = require('express');
var fs      = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var path    = require("path");
var bodyParser = require("body-parser");// npm install 

app.use(bodyParser.urlencoded({extended: true}));


app.use(express.static(path.join(__dirname, 'public')));

app.use("/styles",  express.static(__dirname + '/public/stylesheets'));
app.use("/scripts", express.static(__dirname + '/public/javascripts'));


var Seller = function(sellerName, rating, details, originalPrice) {
  this.sellerName = sellerName; // string, 'Target'
  this.rating = rating; // string
  this.details = details; // string
  this.originalPrice = originalPrice; // string, '$249.99'
  this.cashback = {
      cName: '',
      cDiscount: 0,
      cLink: ''
  };
  this.giftCard = {
      gName: '',
      gDiscount: 0,
      gLink: ''
  };
  this.saving = {
      priceWithCashback: 0.0,
      priceWithGiftCard: 0.0,
      priceWithBoth: 0.0
  };
  this.coupon = '';
};

Seller.prototype.calculation = function() {
  this.saving.priceWithCashback = Math.round((this.originalPrice * (1 - 0.01 * this.cashback.cDiscount)) * 100) / 100;
  this.saving.priceWithGiftCard = Math.round((this.originalPrice * (1 - 0.01 * this.giftCard.gDiscount)) * 100) / 100 ;
  this.saving.priceWithBoth = Math.round((this.originalPrice - this.originalPrice*0.01*this.cashback.cDiscount - this.originalPrice*0.01*this.giftCard.gDiscount) * 100) / 100 ;
};

var cLinks = {
  'Befrugal': 'https://www.befrugal.com/',
  'Top Cashback': 'https://www.topcashback.com/',
  'Coupon Cactus': 'https://www.couponcactus.com/',
  'Mr. Rebates': 'https://www.mrrebates.com/',
  'Ebates': 'https://www.ebates.com/',
  'RebatesMe.com': 'http://www.rebatesme.com/'
};

var gLinks = {
  'Cardpool': 'https://www.cardpool.com/',
  'Card Cookie': 'https://cardcookie.com/',
  'Gift Card Spread': 'https://www.giftcardspread.com/',
  'GiftCardBin': 'https://www.giftcardbin.com/',
  'SaveYa': 'https://www.saveya.com/'
};


var output = [];
var sellers = [];
// var urlGoogle = "https://www.google.com/shopping/product/8904299519205289680?hl=en&output=search&q=kitchen%20aid%20mixers&oq=kitchen%20aid&prds=hsec:online,paur:ClkAsKraX0RE3UEXs9219coC84DsRTfE5r92azN4IjJfjryWlMEkgiMgj3aYWTuSzokf2BV8984XZTU5_7YF5pAqNvAGAfXbxiKlrCHTDnqJ3VE7dSEGovnB5xIZAFPVH73hfCiBL8puZaVMnAg3KOAMg3Mocw&sa=X&ved=0ahUKEwjco8GxnJ_aAhVRhuAKHaJcCRYQ2SsIFw";
var urlGoogle = '';
var selectedSeller = '';

app.get('/search', function(req, res) {
  res.render("search.ejs");
});

app.post('/search', function(req, res) {
  urlGoogle = req.body.url;
  selectedSeller = req.body.sS;
  console.log(urlGoogle);
  console.log(selectedSeller);
  res.redirect("/scrape");
});

app.get('/clean', function(req, res) {
    output = [];
    sellers = [];
    urlGoogle = '';
    selectedSeller = '';
    res.redirect("/search");
});

app.get('/scrape', function(req, res){
  // google shop seller selection
  
  var index0 = urlGoogle.indexOf("prds=") + 5;
  var c = "scoring:mrd,"
  var newURL = [urlGoogle.slice(0, index0), c, urlGoogle.slice(index0)].join('');
  urlGoogle = newURL;

  var index1 = urlGoogle.indexOf("?");
  var index2 = index1 - 6;
  var a = "/update";
  var b = "/update/online";

  if (urlGoogle.substring(index2, index1) === 'online') {
    newURL = [urlGoogle.slice(0, (index2 - 1)), a, urlGoogle.slice((index2 - 1))].join('');
  } else {
    newURL = [urlGoogle.slice(0, index1), b, urlGoogle.slice(index1)].join('');
  }
  urlGoogle = newURL;
  request(urlGoogle, function(error, response, html) {
    if (!error) {
      // res.send(html)
      var $ = cheerio.load(html);
      $('tbody tr').each(function() {
        var data = $(this);
        if (data.attr('class') && data.find('.os-rating-col').text().trim() !== 'No rating' && output.length <= 10) {
          var s = new Seller(data.find('.os-seller-name').text().trim(), data.find('.os-rating-col').text().trim(), data.find('.os-details-col').text().trim(), parseFloat(data.find('.os-total-col').text().trim().substring(1)));
          output.push(s);
          sellers.push(data.find('.os-seller-name').text().trim());
        }
      });

      // console.log(output);
      console.log('this is the sellers from google');
      console.log(sellers);
      // sellers = [ "Macy's", 'Target' ];

      sellers.forEach(function(seller) {

        // CashbackHolic
        url = "https://www.cashbackholic.com/compare.php?s=" + seller;
        var cashBackWebsites = ['Befrugal', 'Top Cashback', 'Coupon Cactus', 'Mr. Rebates', 'Ebates', 'RebatesMe.com'];
        var bestCashBackRate = 0.0;
        var bestCashBackWebsite = null;
        
        request(url, function(error, response, html) {
          if (!error) {
            var myRe = new RegExp('cashback_list ="(.*)";');
            var myArray = myRe.exec(html);
            var table = myArray[1];
            // res.send(table);
            var $ = cheerio.load(table);
            var count = 0;
            $('#cashback_list tr').each(function() {
                var data = $(this);
                if (cashBackWebsites.includes(data.find('.notranslate').text().trim())) {
                  // console.log(data.find('.notranslate').text());
                  var detail = data.find('.tdcashback');
                  if (detail.children().first().text().trim() === '' && detail.children().last().text().trim() === '%') {
                    // console.log(detail.text());
                    if (parseFloat(detail.find('.cbtext').text().trim()) > bestCashBackRate) {
                      bestCashBackRate = parseFloat(detail.find('.cbtext').text().trim());
                      bestCashBackWebsite = data.find('.notranslate').text().trim();
                    }
                  }
                }
            });
            // console.log(bestCashBackRate + '%' + ' from ' + bestCashBackWebsite);
            for (var i = 0; i < output.length; i++) {
              if (output[i].sellerName === seller) {
                output[i].cashback.cName = bestCashBackWebsite;
                output[i].cashback.cDiscount = bestCashBackRate;
                output[i].cashback.cLink = cLinks[bestCashBackWebsite];
              }
            }

            // giftcardgranny
            // parse seller name: ' ' -> '-', "'" -> ''
            var oldseller = seller;
            seller = seller.replace(/'/g, "");
            seller = seller.replace(/ /g, "-");
            seller = seller.replace(/&/g, "and")
            seller = seller.replace(/.com/g, "")

            // art-com, hotels-com
            url2 = "https://www.giftcardgranny.com/buy-gift-cards/" + seller + "/";
            var giftCardWebsites = ['Cardpool', 'Card Cookie', 'Gift Card Spread', 'GiftCardBin', 'SaveYa'];
            var bestGiftCardSavingRate = 0.0;
            var bestGiftCardWebsite = null;
            request(url2, function(error, response, html) {
              if (!error) {
                // cards parse
                var myRe1 = new RegExp('cards =(.*);');
                var myArray1 = myRe1.exec(html);
                // console.log(seller + '  ' + myArray1);
                if (myArray1 !== null) {// have gift card
                  var cardsString = myArray1[1].trim();
                  var cardsObjArr = JSON.parse(cardsString);

                  // networks parse
                  var myRe2 = new RegExp('networks =(.*);');
                  var myArray2 = myRe2.exec(html);
                  var networksString = myArray2[1].trim();
                  var networksObj = JSON.parse(networksString);


                  cardsObjArr.forEach(function(element) {
                    // console.log(element.sP + '% from ' + networksObj[element.nId].name);
                    if (bestGiftCardSavingRate < element.sP && element.ty === 'ecode' && giftCardWebsites.includes(networksObj[element.nId].name)) {
                      bestGiftCardSavingRate = element.sP;
                      bestGiftCardWebsite = networksObj[element.nId].name;
                    }
                  });

                  // console.log(bestGiftCardSavingRate + '% from ' + bestGiftCardWebsite);
                  for (var i = 0; i < output.length; i++) {
                    if (output[i].sellerName === oldseller && bestGiftCardWebsite !== null) {
                      output[i].giftCard.gName = bestGiftCardWebsite;
                      output[i].giftCard.gDiscount = bestGiftCardSavingRate;
                      output[i].giftCard.gLink = gLinks[bestGiftCardWebsite];
                    }
                  }

                  // calculation
                  console.log(output.length);
                  for (var i = 0; i < output.length; i++) {
                    if (output[i].sellerName === oldseller) {
                      output[i].calculation();
                    }
                  }

                  // res.send(oldseller + ' ' + bestCashBackRate + '%' + ' from ' + bestCashBackWebsite + ' and ' +bestGiftCardSavingRate + '% from ' + bestGiftCardWebsite);
                  console.log(oldseller + ' ' + bestCashBackRate + '%' + ' from ' + bestCashBackWebsite + ' and ' +bestGiftCardSavingRate + '% from ' + bestGiftCardWebsite);
                  console.log(output);

                  // file
                  var temp = '{"output":' + JSON.stringify(output) + '}';
                  // fs.writeFileSync('output.json', temp);
                  fs.writeFileSync(__dirname + '/public/' + 'output.json', temp);
                  var isRender = true;
                  for (var i = 0; i < output.length; i++) {
                    if (output[i].saving.priceWithBoth < 1.0) {
                      isRender = false;
                    }
                  }
                  if (isRender) {
                    // res.sendfile
                    res.sendfile(__dirname + '/public/home.html');
                  }

                } else {// no giftCard

                  // calculation
                  for (var i = 0; i < output.length; i++) {
                    if (output[i].sellerName === oldseller) {
                      output[i].calculation();
                    }
                  }

                  console.log(oldseller + ' ' + bestCashBackRate + '%' + ' from ' + bestCashBackWebsite + ' and ' +bestGiftCardSavingRate + '% from ' + bestGiftCardWebsite);
                  console.log(output);

                  // file
                  var temp = '{"output":' + JSON.stringify(output) + '}';
                  fs.writeFileSync(__dirname + '/public/' + 'output.json', temp);
                  var isRender = true;
                  for (var i = 0; i < output.length; i++) {
                    if (output[i].saving.priceWithBoth < 1.0) {
                      isRender = false;
                    }
                  }
                  if (isRender) {
                    // res.sendfile
                    res.sendfile(__dirname + '/public/home.html');
                  }
                }


              } else {
                console.log('Error from giftcardgranny Scrape');
                console.log(error);
              }
            });

          } else {
            console.log('Error from CashbackHolic Scrape');
            console.log(error);
          }
        });

      });


    } else {
      console.log('Error from Google Scrape');
      console.log(error);
    }

  });

});

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;
