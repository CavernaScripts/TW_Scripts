javascript: 
(function() {
    'use strict';
    const CommandSender = {
        confirmButton: null,
        durationMs: 0,
        init() {
            if ($('#CStime').length) return;
            const formTable = $('#command-data-form tbody')[0];
            if (!formTable) return;
            $(formTable).append(`
                <tr class="cs-row" style="background-color:#f4e4bc;">
                    <td><b>Chegada Desejada:</b></td>
                    <td><input type="datetime-local" id="CStime" step=".001" style="font-size:9pt;font-family:Verdana;width:200px;"></td>
                </tr>
                <tr class="cs-row" style="background-color:#f4e4bc;">
                    <td><b>Ajuste (Offset ms):</b></td>
                    <td>
                        <input type="number" id="CSoffset" style="font-size:9pt;font-family:Verdana;width:60px;">
                        <span id="ping-info" style="font-size:8pt;color:#666;margin-left:5px;"></span>
                        <button type="button" id="CSbutton" class="btn" style="float:right;">Agendar Comando</button>
                    </td>
                </tr>
            `);
            this.confirmButton = $('#troop_confirm_submit');
            const durationText = $('#command-data-form')
                .find('td:contains("Duração:")')
                .next()
                .text()
                .trim();
            const [h, m, s] = durationText.split(':').map(Number);
            this.durationMs = ((h * 3600) + (m * 60) + s) * 1000;
            let serverLag = 0;
            if (typeof Timing !== 'undefined' && typeof Timing.offset_to_server !== 'undefined') {
                serverLag = -Math.round(Timing.offset_to_server);
                $('#ping-info').text(`(Auto: ${serverLag}ms)`);
            }
            const savedOffset = localStorage.getItem('CS.offset');
            $('#CSoffset').val(savedOffset !== null ? savedOffset : serverLag);
            $('#CStime').val(this.toDatetimeLocalValue(Date.now() + this.durationMs));
            $('#CSbutton').on('click', () => {
                const userOffset = parseInt($('#CSoffset').val(), 10) || 0;
                const targetTime = this.getSendTime();
                localStorage.setItem('CS.offset', userOffset);
                this.confirmButton.addClass('btn-disabled');
                const delay = targetTime - Timing.getCurrentServerTime() + userOffset;
                console.log(`[Análise] Comando agendado com offset de ${userOffset}ms`);
                setTimeout(() => {
                    this.confirmButton.click();
                }, Math.max(0, delay));
                $('#CSbutton').prop('disabled', true).text('Agendado...');
                $('.cs-row').css('background-color', '#d5ffce');
            });
        },
        getSendTime() {
            const arrivalDate = new Date($('#CStime').val());
            return arrivalDate.getTime() - this.durationMs;
        },
        toDatetimeLocalValue(timestamp) {
            const d = new Date(timestamp);
            const pad = (n, size = 2) => String(n).padStart(size, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
                + `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.`
                + `${pad(d.getMilliseconds(), 3)}`;
        }
    };
    const checkExist = setInterval(() => {
        if (typeof jQuery === 'undefined' || typeof Timing === 'undefined') return;
        if (!$('#command-data-form').length) return;
        clearInterval(checkExist);
        CommandSender.init();
    }, 100);
})();
