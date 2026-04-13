javascript:(function() {
'use strict';

const GLOBAL_KEY = 'SNIPER_MULTI_V15';
const POOL_KEY = 'VILLAGE_POOL_V15';
const CALIB_KEY = 'CALIB_V15';

const SNIPER = {

    world: game_data.world,
    villageId: game_data.village.id,

    hasScheduled: false,
    pingHistory: [],
    stats: { avg: 40, jitter: 5 },

    init() {
        if ($('#SniperBox').length) return;

        const table = $('#command-data-form tbody')[0] || $('.main table')[0];
        if (!table) return;

        $(table).append(`
            <tr id="SniperBox">
                <td colspan="2" style="background:#f4e4bc; padding:8px;">
                    <b>SNIPER</b><br>
                    <input type="datetime-local" id="SNIPE_TIME" step="0.001" style="width:220px;">
                    <button id="SN_SYNC" class="btn">SYNC</button>
                    <button id="SN_RUN" class="btn">AGENDAR</button>
                    <div id="SN_INFO" style="font-size:10px; margin-top:5px;"></div>
                </td>
            </tr>
        `);

        $('#SN_RUN').click(() => this.schedule());
        $('#SN_SYNC').click(() => this.broadcast());

        this.startPing();
        setInterval(()=>this.register(), 30000);
        setInterval(()=>this.checkGlobal(), 1000);
    },

    /* ---------------- PING INTELIGENTE ---------------- */

    startPing() {
        setInterval(async () => {
            const t0 = performance.now();
            await fetch(`/game.php?village=${this.villageId}&screen=overview`, { cache:'no-store' });
            const ping = (performance.now() - t0)/2;

            this.pingHistory.push(ping);
            if (this.pingHistory.length > 20) this.pingHistory.shift();

            const sorted = [...this.pingHistory].sort((a,b)=>a-b);

            this.stats = {
                avg: Math.round(sorted.reduce((a,b)=>a+b,0)/sorted.length),
                jitter: Math.round((sorted.at(-1) - sorted[0]) / 2)
            };

            $('#SN_INFO').text(`Ping: ${this.stats.avg}ms ±${this.stats.jitter}`);
        }, 4000);
    },

    /* ---------------- DURAÇÃO ---------------- */

    getDuration() {
        const t = $('#command-data-form td:contains("Duração:")').next().text();
        const [h,m,s] = t.split(':').map(Number);
        return ((h*3600)+(m*60)+s)*1000;
    },

    /* ---------------- AUTO APRENDIZADO ---------------- */

    getCalibration() {
        const db = JSON.parse(localStorage.getItem(CALIB_KEY) || '{}');
        return db[this.villageId] || 0;
    },

    saveCalibration(error) {
        const db = JSON.parse(localStorage.getItem(CALIB_KEY) || '{}');

        const prev = db[this.villageId] || 0;

        // aprendizado progressivo (média ponderada)
        const updated = Math.round((prev * 0.7) + (error * 0.3));

        db[this.villageId] = updated;

        localStorage.setItem(CALIB_KEY, JSON.stringify(db));
    },

    /* ---------------- REGISTRO ---------------- */

    register() {
        const pool = JSON.parse(localStorage.getItem(POOL_KEY) || '[]');

        const duration = this.getDuration();
        const role = duration < 1200000 ? 'ATK' : 'DEF';

        const entry = {
            id: this.villageId,
            duration,
            role,
            last: Date.now()
        };

        const updated = pool.filter(v => v.id !== this.villageId && Date.now()-v.last < 300000);
        updated.push(entry);

        localStorage.setItem(POOL_KEY, JSON.stringify(updated));
    },

    /* ---------------- IA DE SELEÇÃO ---------------- */

    selectVillages(pool) {

        const atk = pool
            .filter(v=>v.role==='ATK')
            .sort((a,b)=>a.duration-b.duration)
            .slice(0,3);

        const def = pool
            .filter(v=>v.role==='DEF')
            .sort((a,b)=>b.duration-a.duration)
            .slice(0,2);

        return [...atk, ...def];
    },

    /* ---------------- BROADCAST ---------------- */

    broadcast() {

        const target = new Date($('#SNIPE_TIME').val()).getTime();
        if (!target) return alert("Define horário!");

        const pool = JSON.parse(localStorage.getItem(POOL_KEY) || '[]');
        const selected = this.selectVillages(pool);

        const offset = (this.stats.avg/2)+this.stats.jitter;

        const orders = selected.map((v,i)=>{

            let send = target - v.duration - offset + (i*25);

            if (send < Timing.getCurrentServerTime()+3000) {
                send = Timing.getCurrentServerTime()+3000;
            }

            return { id:v.id, sendTime:send };
        });

        localStorage.setItem(GLOBAL_KEY, JSON.stringify({
            target,
            orders,
            created: Timing.getCurrentServerTime()
        }));

        console.log('[V15] MISSÃO CRIADA', orders);
    },

    /* ---------------- EXECUÇÃO ---------------- */

    checkGlobal() {

        const data = JSON.parse(localStorage.getItem(GLOBAL_KEY));
        if (!data) return;

        if (Timing.getCurrentServerTime() - data.created > 15000) return;

        const my = data.orders.find(v=>v.id==this.villageId);
        if (!my || this.hasScheduled) return;

        this.schedule(true, my.sendTime, data.target);
    },

    async schedule(auto=false, forced=null, target=null) {

        if (this.hasScheduled) return;

        const drift = Timing.getCurrentServerTime() - Date.now();

        const sendTime = forced || (
            new Date($('#SNIPE_TIME').val()).getTime() + drift
        ) - this.getDuration() - (this.stats.avg/2 + this.stats.jitter + this.getCalibration());

        const wait = sendTime - Timing.getCurrentServerTime();

        if (wait < 1000) {
            console.warn('[V15] Cancelado tempo insuficiente');
            return;
        }

        this.hasScheduled = true;

        $('#SN_RUN').text("AGENDADO").prop('disabled', true);

        console.log('[V15 DEBUG]', {
            agora: Timing.getCurrentServerTime(),
            sendTime,
            wait
        });

        setTimeout(async ()=>{

            await this.precise(sendTime);

            const before = Timing.getCurrentServerTime();

            $('#troop_confirm_submit').click();

            const after = Timing.getCurrentServerTime();

            const error = after - sendTime;

            console.log('[V15 RESULT]', { error });

            this.saveCalibration(error);

        }, Math.max(0, wait-200));
    },

    precise(target) {
        return new Promise(res=>{
            const loop=()=>{
                if (Timing.getCurrentServerTime() >= target-2){
                    while(Timing.getCurrentServerTime()<target-0.3){}
                    res();
                } else requestAnimationFrame(loop);
            };
            loop();
        });
    }

};

/* ---------------- BOOT ---------------- */

const boot = setInterval(()=>{
    if (typeof jQuery !== 'undefined' && typeof Timing !== 'undefined') {
        clearInterval(boot);
        SNIPER.init();
    }
},100);

})();
