javascript:(function() {
    'use strict';

    /* 🧠 MOTOR IA MASTER (SUAVIZAÇÃO + HALF-PING + ANTI-SPIKE) */
    const AI_ENGINE = {
        history: JSON.parse(localStorage.getItem('AI_SNIPER_DATA') || '[]'),
        lastPrediction: null,
        
        save() {
            localStorage.setItem('AI_SNIPER_DATA', JSON.stringify(this.history));
        },

        addSample(ping, jitter, erro) {
            /* 🛡️ Filtro de Sanidade: evita que erros bizarros corrompam o modelo */
            if (Math.abs(erro) > 300) return console.warn('[IA] Amostra ignorada (erro fora da curva)');

            this.history.push({
                ping, jitter, erro,
                hour: new Date().getHours(),
                time: Date.now()
            });
            if (this.history.length > 300) this.history.shift();
            this.save();
        },

        predict(stats) {
            if (this.history.length < 5) return 0;

            const now = Date.now();
            const hourNow = new Date().getHours();
            const dataset = this.history.filter(s => (now - s.time < 3600000) || (Math.abs(s.hour - hourNow) <= 1));
            const data = dataset.length > 10 ? dataset : this.history;

            let pesoTotal = 0, somaErro = 0;
            data.forEach(s => {
                const diffPing = Math.abs(s.ping - stats.avg);
                const peso = 1 / (diffPing + 1);
                somaErro += s.erro * peso;
                pesoTotal += peso;
            });

            const rawPrediction = somaErro / pesoTotal;

            /* 🌊 Suavização Exponencial: evita oscilações bruscas no offset */
            this.lastPrediction = this.lastPrediction === null ? rawPrediction : (this.lastPrediction * 0.7) + (rawPrediction * 0.3);
            return this.lastPrediction;
        },

        getAdaptiveRisk(stats) {
            const avgJitter = this.history.length ? this.history.reduce((a, b) => a + b.jitter, 0) / this.history.length : 30;
            if (stats.jitter > avgJitter * 2.0) return { label: 'CRÍTICO', color: '#f00' };
            if (stats.jitter > avgJitter * 1.4) return { label: 'MÉDIO', color: '#d60' };
            return { label: 'ESTÁVEL', color: '#060' };
        }
    };

    const IA_SNIPER_MASTER = {
        world: game_data.world,
        villageId: game_data.village.id,
        pingHistory: [],
        calibration: parseFloat(localStorage.getItem(`WAR_calib_${game_data.world}`)) || 0,

        init() {
            if ($('#SniperBox').length) return;
            const formTable = $('#command-data-form tbody')[0];
            if (!formTable) return;

            $(formTable).append(`
                <tr id="SniperBox" style="background-color: #f4e4bc; border: 2px solid #7d5130;">
                    <td colspan="2" style="padding: 12px; font-family: Verdana, Arial, sans-serif;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <b style="font-size: 11pt; color: #402000;">SNIPER:</b>
                            <input type="datetime-local" id="CStime" step="0.001" style="font-size: 11pt; width: 270px; padding: 4px; border: 1px solid #7d5130;">
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #dcc694; padding-top: 8px;">
                            <span style="font-size: 8pt; color: #603000; line-height:1.4;">
                                Rede: <span id="ping-info">--</span> | Status: <b id="risk-info">--</b><br>
                                IA Offset (Compensação): <b id="calib-info" style="color: #c00;">0ms</b>
                            </span>
                            <button type="button" id="CSrun" class="btn" style="font-weight: bold; padding: 8px 25px;">AGENDAR</button>
                        </div>
                    </td>
                </tr>
            `);

            this.confirmButton = $('#troop_confirm_submit');
            const durationText = $('#command-data-form').find('td:contains("Duração:")').next().text().trim();
            const [h, m, s] = durationText.split(':').map(Number);
            this.durationMs = ((h * 3600) + (m * 60) + s) * 1000;

            this.startPingMonitor();
            $('#CSrun').on('click', () => this.scheduleAI());
        },

        startPingMonitor() {
            setInterval(async () => {
                const start = performance.now();
                /* Endpoint otimizado por aldeia para rotas mais estáveis */
                await fetch(`/game.php?village=${this.villageId}&screen=overview`, { method: 'GET', cache: 'no-store' });
                const ping = (performance.now() - start) / 2;
                
                if (ping < 800) {
                    this.pingHistory.push(ping);
                    if (this.pingHistory.length > 20) this.pingHistory.shift();
                }

                const sorted = [...this.pingHistory].sort((a, b) => a - b);
                const stats = {
                    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) || 40,
                    jitter: Math.round((sorted[sorted.length - 1] - sorted[0]) / 2) || 5
                };

                const risk = AI_ENGINE.getAdaptiveRisk(stats);
                const predictedError = AI_ENGINE.predict(stats);
                
                /* 📡 Lógica Half-Ping + Jitter + IA */
                const networkComp = (stats.avg / 2) + stats.jitter;
                const displayOffset = networkComp + predictedError + this.calibration;

                $('#ping-info').text(`${stats.avg}ms ±${stats.jitter}`);
                $('#risk-info').text(risk.label).css('color', risk.color);
                $('#calib-info').text(`${displayOffset.toFixed(1)}ms`);
                
                this.currentStats = stats;
            }, 3000);
        },

        async scheduleAI() {
            const arrivalInput = $('#CStime').val();
            if (!arrivalInput) return alert("Defina o horário!");

            const stats = this.currentStats;
            const predictedError = AI_ENGINE.predict(stats);
            
            /* 🎯 Half-Ping: O envio é apenas IDA, não ida e volta */
            const networkComponent = (stats.avg / 2) + stats.jitter;
            const totalOffset = networkComponent + predictedError + this.calibration;

            const drift = Timing.getCurrentServerTime() - Date.now();
            const targetArrival = new Date(arrivalInput).getTime() + drift;
            const targetSend = targetArrival - this.durationMs;
            const sendTime = targetSend - totalOffset;

            if (sendTime - Timing.getCurrentServerTime() < 1000) return alert("Horário expirado!");

            $('#CSrun').text("AGENDADO").addClass('btn-disabled').prop('disabled', true);

            setTimeout(async () => {
                await this.preciseWait(sendTime);
                this.executeAIClick(sendTime, stats);
            }, Math.max(0, (sendTime - Timing.getCurrentServerTime()) - 150));
        },

        preciseWait(target) {
            return new Promise(resolve => {
                const loop = () => {
                    const now = Timing.getCurrentServerTime();
                    if (now >= target - 2) {
                        /* Busy Wait Final Ultra-Curto (0.2ms) */
                        while (Timing.getCurrentServerTime() < target - 0.2) { }
                        resolve();
                    } else requestAnimationFrame(loop);
                };
                requestAnimationFrame(loop);
            });
        },

        executeAIClick(plannedTime, stats) {
            const t0 = performance.now();
            this.confirmButton.click();
            const clickServer = Timing.getCurrentServerTime();
            const t1 = performance.now();

            const procDelay = t1 - t0;
            const erroReal = (clickServer + procDelay) - plannedTime;

            AI_ENGINE.addSample(stats.avg, stats.jitter, erroReal);
            console.log(`[MASTER REPORT] Erro: ${erroReal.toFixed(2)}ms | NetworkComp: ${(stats.avg/2 + stats.jitter).toFixed(1)}ms`);
        }
    };

    const boot = setInterval(() => {
        if (typeof jQuery !== 'undefined' && typeof Timing !== 'undefined' && $('#command-data-form').length) {
            clearInterval(boot);
            IA_SNIPER_MASTER.init();
        }
    }, 100);
})();
