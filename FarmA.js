javascript:
var arr = $("a.farm_icon_a")
        , i = 0
        , t = setInterval(function ()
        {
                $(arr[i++])
                        .click();
                if (i > arr.length) clearInterval(t);
        }, 400);
