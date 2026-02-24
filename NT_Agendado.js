javascript:
// ==UserScript==
// @name         PPP - NT Precision Dominaria
// @author       Cap Caverna / Ge
// @version      10.5
// @include      https://*screen=place&try=confirm*
// ==/UserScript==

CommandSender = {
    confirmButton: null,
    duration: null,
    dateNow: null,
    offset: null,
    init: function() {
        /* Injeção no padrão PPP: fundo bege e bordas escuras */
        let ppp_panel = `
            <tr class="ppp_row" style="background: #f4e4bc; border-left: 5px solid #21881e;">
                <td style="font-weight:bold; color:#3b240b;">CHEGADA (MS):</td>
                <td><input type="datetime-local" id="CStime" step=".001" style="border:1px solid #3b240b; font-family:Verdana; font-size:10pt;"></td>
            </tr>
            <tr class="ppp_row" style="background: #f4e4bc; border-left: 5px solid #21881e;">
                <td style="font-weight:bold; color:#3b240b;">OFFSET PPP:</td>
                <td>
                    <input type="number" id="CSoffset" style="width:60px; border:1px solid #3b240b;">
                    <button type="button" id="CSbutton" class="btn" style="background:#21881e; color:white; font-weight:bold; border-radius:4px; float:right;">CONFIRMAR NT</button>
                </td>
            </tr>`;
        
        $($('#command-data-form').find('tbody')[0]).append(ppp_panel);
        
        this.confirmButton = $('#troop_confirm_submit');
        this.duration = $('#command-data-form').find('td:contains("Duração:")').next().text().split(':').map(Number);
        this.offset = localStorage.getItem('CS.offset') || -250;
        this.dateNow = this.convertToInput(new Date());
        
        $('#CSoffset').val(this.offset);
        $('#CStime').val(this.dateNow);
        
        $('#CSbutton').click(function() {
            var _off = Number($('#CSoffset').val());
            var _targetTime = CommandSender.getAttackTime();
            localStorage.setItem('CS.offset', _off);
            
            CommandSender.confirmButton.addClass('btn-disabled');
            UI.SuccessMessage('Sincronia PPP Ativada!', 1000);
            
            setTimeout(function() {
                CommandSender.confirmButton.click();
            }, _targetTime - Timing.getCurrentServerTime() + _off);
            
            this.disabled = true;
        });
    },
    getAttackTime: function() {
        var _time = new Date($('#CStime').val().replace('T', ' '));
        _time.setHours(_time.getHours() - this.duration[0]);
        _time.setMinutes(_time.getMinutes() - this.duration[1]);
        _time.setSeconds(_time.getSeconds() - this.duration[2]);
        return _time;
    },
    convertToInput: function(_date) {
        _date.setHours(_date.getHours() + this.duration[0]);
        _date.setMinutes(_date.getMinutes() + this.duration[1]);
        _date.setSeconds(_date.getSeconds() + this.duration[2]);
        var a = {
            y: _date.getFullYear(),
            m: _date.getMonth() + 1,
            d: _date.getDate(),
            time: _date.toTimeString().split(' ')[0],
            ms: _date.getMilliseconds()
        };
        if (a.m < 10) a.m = '0' + a.m;
        if (a.d < 10) a.d = '0' + a.d;
        if (a.ms < 100) { a.ms = '0' + a.ms; if (a.ms < 10) a.ms = '0' + a.ms; }
        return a.y + '-' + a.m + '-' + a.d + 'T' + a.time + '.' + a.ms;
    }
};

var ppp_check = setInterval(function() {
    if (document.getElementById('command-data-form') && typeof jQuery !== 'undefined') {
        CommandSender.init();
        clearInterval(ppp_check);
    }
}, 1);

setTimeout(function() {
    $('#CSoffset').val('-' + Timing.offset_to_server);
}, 2000);
