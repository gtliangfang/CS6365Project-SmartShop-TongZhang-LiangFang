function hideMe(box, cb_name)
{
    if(!document.getElementById(box).checked) {
        var elem = document.getElementsByName('Top Cashback');
        for (var i=0;i<elem.length;i++) {
            elem[i].style.display="none";
        }
    } else {
        var elem = document.getElementsByName('Top Cashback');
        for (var i=0;i<elem.length;i++) {
            elem[i].style.display="";
        }
    }
}