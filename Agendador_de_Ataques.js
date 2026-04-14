javascript:(function() {
    'use strict';

    const STORAGE_KEYS = {
        AI: 'AI_SNIPER_DATA_V2',
        BIAS: 'AI_SNIPER_BIAS_V2'
    };

    const AI_ENGINE = {
        history: JSON.parse(localStorage.getItem(STORAGE_KEYS.AI) || '[]'),

        save() {
            localStorage.setItem(STORAGE_KEYS.AI, JSON.stringify(this.history));
        },

        addSample(sample) {
            if (!sample || !Number.isFinite(sample.errorMs)) return;
            if (Math.abs(sample.errorMs) > 400) return;

            this.history.push({
                oneWayDelay: Number(sample.oneWayDelay || 0),
                rtt: Number(sample.rtt || 0),
                clockOffset: Number(sample.clockOffset || 0),
                errorMs: Number(sample.errorMs || 0),
                hour: new Date().getHours(),
                time: Date.now()
            });

            if (this.history.length > 400) this.history.shift();
            this.save();
        },

        predict(current) {
            if (!this.history.length) return 0;

            const now = Date.now();
            const hourNow = new Date().getHours();

            const candidates = this.history.filter(s => {
                const recentEnough = (now - s.time) < 6 * 60 * 60 * 1000;
                const sameHourBand = Math.abs(s.hour - hourNow) <= 2;
                return recentEnough || sameHourBand;
            });

            const data = candidates.length >= 8 ? candidates : this.history;
            if (!data.length) return 0;

            let weightedSum = 0;
            let totalWeight = 0;

            for (const s of data) {
                const diffDelay = Math.abs((s.oneWayDelay || 0) - (current.oneWayDelay || 0));
                const diffRtt = Math.abs((s.rtt || 0) - (current.rtt || 0));
                const weight = 1 / (1 + diffDelay + (diffRtt * 0.35));
                weightedSum += s.errorMs * weight;
                totalWeight += weight;
            }

            return totalWeight ? (weightedSum / totalWeight) : 0;
        }
    };

    const IA_SNIPER_MASTER = {
        confirmButton: null,
        durationMs: 0,

        syncSamples: [],
        coarseTimer: null,

        clockOffsetMs: 0,
        oneWayDelayMs: 60,
        avgRttMs: 120,
        jitterMs: 5,

        biasCorrectionMs: Number(localStorage.getItem(STORAGE_KEYS.BIAS) || '150'),

        started: false,
        lastSyncAt: 0,
        currentStats: null,

        init() {
            if ($('#SniperBox').length) return;

            const formTable = $('#command-data-form tbody')[0];
            if (!formTable) return;

            this.confirmButton = $('#troop_confirm_submit');
            if (!this.confirmButton.length) return;

            const durationText = $('#command-data-form').find('td:contains("Duração:")').next().text().trim();
            const durationMatch = durationText.match(/(\d{2}):(\d{2}):(\d{2})/);
            if (!durationMatch) return;

            const h = parseInt(durationMatch[1], 10);
            const m = parseInt(durationMatch[2], 10);
            const s = parseInt(durationMatch[3], 10);
            this.durationMs = ((h * 3600) + (m * 60) + s) * 1000;

            $(formTable).append(`
                <tr id="SniperBox" style="background-color: #f4e4bc; border: 2px solid #7d5130;">
                    <td colspan="2" style="padding: 10px; font-family: Verdana, Arial, sans-serif;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <b style="font-size:10pt; color:#402000;">CHEGADA ALVO:</b>
                            <input type="datetime-local" id="CStime" step="0.001" style="font-size:10pt; width:240px; padding:3px; border:1px solid #7d5130;">
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; background:rgba(0,0,0,0.05); padding:5px; border-radius:4px;">
                            <label style="font-size:8pt; color:#402000; cursor:pointer;">
                                <input type="checkbox" id="useIA" checked> Usar IA Automática
                            </label>
                            <div id="manual-input-area" style="display:none;">
                                <span style="font-size:8pt; color:#402000;">Offset manual (ms):</span>
                                <input type="number" id="manualOffset" value="0" style="width:70px; font-size:8pt; padding:2px;">
                            </div>
                        </div>

                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px; background:rgba(0,0,0,0.04); padding:6px; border-radius:4px;">
                            <div style="font-size:8pt; color:#603000; line-height:1.45;">
                                RTT: <span id="ping-info">--</span><br>
                                Jitter: <span id="jitter-info">--</span><br>
                                Delay ida: <span id="oneway-info">--</span>
                            </div>
                            <div style="font-size:8pt; color:#603000; line-height:1.45;">
                                Relógio srv/local: <span id="clock-info">--</span><br>
                                IA/Bias: <span id="bias-info">--</span><br>
                                Ajuste final: <b id="calib-info" style="color:#c00;">0ms</b>
                            </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #dcc694; padding-top:8px;">
                            <span style="font-size:8pt; color:#603000; line-height:1.35;">
                                Server clock: <span id="server-clock-ms">--:--:--.---</span><br>
                                Disparo previsto: <span id="fire-preview">--</span>
                            </span>
                            <div style="display:flex; gap:6px; align-items:center;">
                                <button type="button" id="syncNowBtn" class="btn" style="padding:5px 10px;">SYNC</button>
                                <button type="button" id="CSrun" class="btn" style="font-weight:bold; padding:5px 15px; min-width:120px;">AGENDAR</button>
                            </div>
                        </div>
                    </td>
                </tr>
            `);

            this.autoFillFromGameArrival();
            this.bindEvents();
            this.startMonitors();
            this.warmupSync();
        },

        bindEvents() {
            $('#useIA').on('change', function() {
                $('#manual-input-area').toggle(!this.checked);
            });

            $('#syncNowBtn').on('click', async () => {
                $('#syncNowBtn').prop('disabled', true).text('SYNC...');
                await this.forceSyncBurst(8, 120);
                $('#syncNowBtn').prop('disabled', false).text('SYNC');
                this.updateUI();
            });

            $('#CSrun').on('click', () => this.scheduleAI());
        },

        autoFillFromGameArrival() {
            const gameArrivalText = $('#command-data-form').find('td:contains("Chegada:")').next().text().trim();
            const timeMatch = gameArrivalText.match(/(\d{2}):(\d{2}):(\d{2})/);
            if (!timeMatch) return;

            const nowServer = new Date(Timing.getCurrentServerTime());
            const targetDate = new Date(nowServer);

            targetDate.setHours(
                parseInt(timeMatch[1], 10),
                parseInt(timeMatch[2], 10),
                parseInt(timeMatch[3], 10),
                0
            );

            if (targetDate.getTime() < nowServer.getTime()) {
                targetDate.setDate(targetDate.getDate() + 1);
            }

            const finalTarget = new Date(targetDate.getTime() + 30000);
            const offset = finalTarget.getTimezoneOffset() * 60000;
            $('#CStime').val(new Date(finalTarget.getTime() - offset).toISOString().slice(0, -1));
        },

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        getServerNowEstimate() {
            return performance.now() + this.clockOffsetMs;
        },

        formatMs(value) {
            if (!Number.isFinite(value)) return '--';
            return `${value >= 0 ? '+' : ''}${value.toFixed(1)}ms`;
        },

        saveBias() {
            localStorage.setItem(STORAGE_KEYS.BIAS, String(this.biasCorrectionMs));
        },

        async warmupSync() {
            await this.forceSyncBurst(10, 100);
            this.updateUI();
        },

        async forceSyncBurst(count = 6, gap = 100) {
            for (let i = 0; i < count; i++) {
                await this.syncWithServer();
                if (i < count - 1) {
                    await this.sleep(gap);
                }
            }
        },

        async syncWithServer() {
            try {
                const perf0 = performance.now();

                await fetch(`/game.php?village=${game_data.village.id}&screen=overview`, {
                    method: 'GET',
                    cache: 'no-store',
                    credentials: 'same-origin'
                });

                const serverNow = Timing.getCurrentServerTime();
                const perf1 = performance.now();

                const rtt = perf1 - perf0;
                if (!Number.isFinite(rtt) || rtt <= 0 || rtt > 1500) return;

                const midpoint = (perf0 + perf1) / 2;
                const clockOffset = serverNow - midpoint;

                this.syncSamples.push({
                    rtt,
                    clockOffset,
                    at: Date.now()
                });

                if (this.syncSamples.length > 60) {
                    this.syncSamples.shift();
                }

                this.recalculateSyncStats();
                this.lastSyncAt = Date.now();
            } catch (err) {
                // silencioso
            }
        },

        recalculateSyncStats() {
            if (!this.syncSamples.length) return;

            const recent = this.syncSamples.filter(s => (Date.now() - s.at) < 8 * 60 * 1000);
            const source = recent.length >= 6 ? recent : this.syncSamples.slice();

            const sortedByRtt = source.slice().sort((a, b) => a.rtt - b.rtt);
            const bestCount = Math.max(4, Math.min(10, Math.ceil(sortedByRtt.length * 0.35)));
            const best = sortedByRtt.slice(0, bestCount);

            const avgRtt = best.reduce((sum, s) => sum + s.rtt, 0) / best.length;
            const avgOffset = best.reduce((sum, s) => sum + s.clockOffset, 0) / best.length;

            const rtts = best.map(s => s.rtt).sort((a, b) => a - b);
            const jitter = rtts.length > 1 ? (rtts[rtts.length - 1] - rtts[0]) / 2 : 0;

            this.avgRttMs = avgRtt;
            this.jitterMs = jitter;
            this.clockOffsetMs = avgOffset;

            const conservativeOneWay = (avgRtt / 2) + (jitter * 0.35);
            this.oneWayDelayMs = conservativeOneWay;

            const predictedByAI = $('#useIA').is(':checked')
                ? AI_ENGINE.predict({
                    oneWayDelay: this.oneWayDelayMs,
                    rtt: this.avgRttMs,
                    clockOffset: this.clockOffsetMs
                })
                : 0;

            this.currentStats = {
                rtt: this.avgRttMs,
                jitter: this.jitterMs,
                oneWayDelay: this.oneWayDelayMs,
                clockOffset: this.clockOffsetMs,
                predictedByAI
            };
        },

        getFinalOffsetMs() {
            const manualMode = !$('#useIA').is(':checked');
            if (manualMode) {
                return parseFloat($('#manualOffset').val()) || 0;
            }

            const aiCorrection = this.currentStats ? this.currentStats.predictedByAI : 0;

            return (
                this.oneWayDelayMs +
                this.jitterMs * 0.25 +
                this.biasCorrectionMs +
                aiCorrection
            );
        },

        updateUI() {
            const finalOffset = this.getFinalOffsetMs();

            $('#ping-info').text(Number.isFinite(this.avgRttMs) ? `${this.avgRttMs.toFixed(1)}ms` : '--');
            $('#jitter-info').text(Number.isFinite(this.jitterMs) ? `${this.jitterMs.toFixed(1)}ms` : '--');
            $('#oneway-info').text(Number.isFinite(this.oneWayDelayMs) ? `${this.oneWayDelayMs.toFixed(1)}ms` : '--');
            $('#clock-info').text(this.formatMs(this.clockOffsetMs));
            $('#bias-info').text(
                `${this.formatMs(this.biasCorrectionMs)} / IA ${this.formatMs(this.currentStats?.predictedByAI || 0)}`
            );
            $('#calib-info').text(`${finalOffset.toFixed(1)}ms`);
        },

        startMonitors() {
            if (this.started) return;
            this.started = true;

            setInterval(() => {
                const serverNowEstimate = this.getServerNowEstimate();
                const d = new Date(serverNowEstimate);
                const hh = String(d.getHours()).padStart(2, '0');
                const mm = String(d.getMinutes()).padStart(2, '0');
                const ss = String(d.getSeconds()).padStart(2, '0');
                const ms = String(d.getMilliseconds()).padStart(3, '0');
                $('#server-clock-ms').text(`${hh}:${mm}:${ss}.${ms}`);
            }, 25);

            setInterval(async () => {
                await this.syncWithServer();
                this.updateUI();
                this.updateFirePreview();
            }, 1400);

            setInterval(() => {
                this.updateFirePreview();
            }, 120);
        },

        updateFirePreview() {
            const targetStr = $('#CStime').val();
            if (!targetStr || !this.durationMs) {
                $('#fire-preview').text('--');
                return;
            }

            const targetArrivalMs = new Date(targetStr).getTime();
            if (!Number.isFinite(targetArrivalMs)) {
                $('#fire-preview').text('--');
                return;
            }

            const finalOffset = this.getFinalOffsetMs();
            const clickPerfTarget = targetArrivalMs - this.clockOffsetMs - this.durationMs - finalOffset;

            if (!Number.isFinite(clickPerfTarget)) {
                $('#fire-preview').text('--');
                return;
            }

            const clickServerMs = clickPerfTarget + this.clockOffsetMs;
            const d = new Date(clickServerMs);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            const ms = String(d.getMilliseconds()).padStart(3, '0');

            $('#fire-preview').text(`${hh}:${mm}:${ss}.${ms}`);
        },

        async scheduleAI() {
            const targetStr = $('#CStime').val();
            const targetArrivalMs = new Date(targetStr).getTime();

            if (!targetStr || !Number.isFinite(targetArrivalMs)) {
                return alert('Horário inválido!');
            }

            $('#CSrun').text('SINCRONIZANDO...').prop('disabled', true).addClass('btn-disabled');

            await this.forceSyncBurst(10, 80);
            this.updateUI();

            const finalOffset = this.getFinalOffsetMs();

            const clickPerfTarget = targetArrivalMs - this.clockOffsetMs - this.durationMs - finalOffset;
            const nowPerf = performance.now();

            if (clickPerfTarget <= nowPerf + 1500) {
                $('#CSrun').text('AGENDAR').prop('disabled', false).removeClass('btn-disabled');
                return alert('Horário muito próximo!');
            }

            $('#CSrun').text('AGENDADO');

            this.runCoarseWait(clickPerfTarget, targetArrivalMs, finalOffset);
        },

        runCoarseWait(clickPerfTarget, targetArrivalMs, finalOffset) {
            const loop = async () => {
                const remaining = clickPerfTarget - performance.now();

                if (remaining > 5000) {
                    this.coarseTimer = setTimeout(loop, 400);
                    return;
                }

                if (remaining > 1500) {
                    if ((Date.now() - this.lastSyncAt) > 600) {
                        await this.syncWithServer();
                        this.updateUI();
                    }
                    this.coarseTimer = setTimeout(loop, 120);
                    return;
                }

                if (remaining > 250) {
                    if ((Date.now() - this.lastSyncAt) > 350) {
                        await this.syncWithServer();
                        this.updateUI();
                    }
                    this.coarseTimer = setTimeout(loop, 20);
                    return;
                }

                this.preciseWait(clickPerfTarget, targetArrivalMs, finalOffset);
            };

            loop();
        },

        preciseWait(clickPerfTarget, targetArrivalMs, finalOffset) {
            const fineLoop = () => {
                const now = performance.now();
                const remaining = clickPerfTarget - now;

                if (remaining <= 8) {
                    while (performance.now() < clickPerfTarget) {}
                    const clickedPerf = performance.now();

                    try {
                        this.confirmButton[0].click();
                    } catch (e) {
                        this.confirmButton.click();
                    }

                    const estimatedServerArrival = clickedPerf + this.clockOffsetMs + finalOffset + this.durationMs;
                    const errorMs = estimatedServerArrival - targetArrivalMs;

                    if ($('#useIA').is(':checked')) {
                        AI_ENGINE.addSample({
                            oneWayDelay: this.oneWayDelayMs,
                            rtt: this.avgRttMs,
                            clockOffset: this.clockOffsetMs,
                            errorMs
                        });

                        this.biasCorrectionMs -= (errorMs * 0.18);

                        if (this.biasCorrectionMs > 400) this.biasCorrectionMs = 400;
                        if (this.biasCorrectionMs < -400) this.biasCorrectionMs = -400;

                        this.saveBias();
                    }

                    $('#CSrun').text(`ENVIADO (${errorMs >= 0 ? '+' : ''}${errorMs.toFixed(1)}ms)`);
                    return;
                }

                requestAnimationFrame(fineLoop);
            };

            requestAnimationFrame(fineLoop);
        }
    };

    const boot = setInterval(() => {
        if (
            typeof jQuery !== 'undefined' &&
            typeof Timing !== 'undefined' &&
            typeof game_data !== 'undefined' &&
            $('#command-data-form').length
        ) {
            clearInterval(boot);
            IA_SNIPER_MASTER.init();
        }
    }, 100);
})();
