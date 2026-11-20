/* ==========================================================================
   QUADRA FLOW – EFFECTS
   Saari animations yahan hain (render.js ke baad load hoti hai):
     - scroll reveal, 3D card tilt, typing text, counters, orbit parallax
     - 3D canvas visuals (pure JS, koi library nahi):
         "neuralnet"  -> 3D neural network + forward-pass pulses + loss graph
         "kmeans"     -> 3D k-means clustering animation
   Naya visual add karna ho to VISUALS object mein ek function add karo aur
   data.js mein `visual: "<naam>"` likh do.
   ========================================================================== */
(function () {
    'use strict';

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    /* ---------------------------------------------------------------
       Toast (Coming Soon click etc.)
       --------------------------------------------------------------- */
    let toastEl = null, toastTimer = null;
    function showToast(msg) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'site-toast';
            toastEl.setAttribute('role', 'status');
            document.body.appendChild(toastEl);
        }
        toastEl.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> ' + msg.replace(/</g, '&lt;');
        // reflow so animation restarts
        toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
    }

    // Koi bhi [data-soon] element click ho to toast dikhao (cards, sidebar, buttons)
    document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-soon]');
        if (!el) return;
        e.preventDefault();
        showToast(el.getAttribute('data-soon') || 'Coming soon. Stay tuned!');
        if (el.classList.contains('btn')) {
            el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
        }
    });

    /* ---------------------------------------------------------------
       Scroll reveal
       --------------------------------------------------------------- */
    function initReveal() {
        const els = $$('.reveal');
        if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach((e) => e.classList.add('in')); return; }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        els.forEach((e) => io.observe(e));
    }

    /* ---------------------------------------------------------------
       3D tilt cards (mouse ke saath card ghoomta hai + glow follow karta hai)
       --------------------------------------------------------------- */
    function initTilt() {
        if (reduceMotion) return;
        $$('[data-tilt]').forEach((el) => {
            const max = parseFloat(el.getAttribute('data-tilt')) || 8;
            el.addEventListener('pointermove', (e) => {
                if (e.pointerType && e.pointerType !== 'mouse') return;
                const r = el.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
                el.style.setProperty('--ry', ((px - 0.5) * 2 * max).toFixed(2) + 'deg');
                el.style.setProperty('--rx', ((0.5 - py) * 2 * max).toFixed(2) + 'deg');
                el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
                el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            });
            el.addEventListener('pointerleave', () => {
                el.style.setProperty('--rx', '0deg');
                el.style.setProperty('--ry', '0deg');
            });
        });
    }

    /* ---------------------------------------------------------------
       Typing / rotating words
       --------------------------------------------------------------- */
    function initRotate() {
        $$('.rot-word').forEach((el) => {
            let words = [];
            try { words = JSON.parse(el.getAttribute('data-words') || '[]'); } catch (e) { /* ignore */ }
            if (!words.length) return;
            if (reduceMotion) { el.textContent = words[0]; return; }
            let w = 0, i = 0, del = false;
            (function tick() {
                const word = words[w];
                el.textContent = word.slice(0, i);
                let delay;
                if (!del && i === word.length) { del = true; delay = 1500; }
                else if (del && i === 0) { del = false; w = (w + 1) % words.length; delay = 350; }
                else { i += del ? -1 : 1; delay = del ? 40 : 90; }
                setTimeout(tick, delay);
            })();
        });
    }

    /* ---------------------------------------------------------------
       Counters
       --------------------------------------------------------------- */
    function initCounters() {
        $$('[data-count]').forEach((el) => {
            const target = parseInt(el.getAttribute('data-count'), 10) || 0;
            if (reduceMotion || !('IntersectionObserver' in window)) { el.textContent = target; return; }
            const io = new IntersectionObserver((entries) => {
                if (!entries[0].isIntersecting) return;
                io.disconnect();
                const t0 = performance.now(), dur = 1100;
                (function step(now) {
                    const p = clamp((now - t0) / dur, 0, 1);
                    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
                    if (p < 1) requestAnimationFrame(step);
                })(t0);
            }, { threshold: 0.4 });
            io.observe(el);
        });
    }

    /* ---------------------------------------------------------------
       Orbit scene parallax (Quadra Flow hero)
       --------------------------------------------------------------- */
    function initOrbit() {
        const scene = document.querySelector('.orbit-scene');
        if (!scene || reduceMotion) return;
        window.addEventListener('pointermove', (e) => {
            const px = (e.clientX / window.innerWidth - 0.5) * 36;
            const py = -(e.clientY / window.innerHeight - 0.5) * 28;
            scene.style.setProperty('--px', px.toFixed(1));
            scene.style.setProperty('--py', py.toFixed(1));
        }, { passive: true });
    }

    /* ==================================================================
       3D CANVAS STAGE  (shared by all canvas visuals)
       ================================================================== */
    function palette() {
        const dark = document.body.getAttribute('data-theme') !== 'light';
        return dark
            ? { a: '56,189,248', b: '192,132,252', c: '52,211,153', d: '244,114,182', ink: '226,232,240', dim: '148,163,184' }
            : { a: '2,132,199', b: '124,58,237', c: '5,150,105', d: '219,39,119', ink: '15,23,42', dim: '100,116,139' };
    }

    function createStage(panel, factory) {
        const canvas = document.createElement('canvas');
        canvas.className = 'viz-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        panel.prepend(canvas);
        const ctx = canvas.getContext('2d');

        const st = {
            ctx, w: 0, h: 0, dpr: 1,
            auto: Math.random() * 6.28,     // auto-rotation angle
            offYaw: 0, offPitch: 0,         // mouse-driven offsets (smoothed)
            tYaw: 0, tPitch: 0,
            ry: 0, rp: 0,
            pal: palette(),
            zoom: 0.26
        };

        function resize() {
            const r = panel.getBoundingClientRect();
            st.dpr = Math.min(window.devicePixelRatio || 1, 2);
            st.w = r.width; st.h = r.height;
            canvas.width = Math.max(1, Math.round(r.width * st.dpr));
            canvas.height = Math.max(1, Math.round(r.height * st.dpr));
            ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
        }

        // 3D -> 2D : pehle Y axis par yaw, phir X axis par pitch, phir perspective
        st.project = function (x, y, z) {
            const cy = Math.cos(st.ry), sy = Math.sin(st.ry), cp = Math.cos(st.rp), sp = Math.sin(st.rp);
            const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
            const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
            const f = 4.2, s = f / (f + z2), unit = Math.min(st.w, st.h) * st.zoom;
            return { x: st.w / 2 + x1 * s * unit, y: st.h / 2 + y2 * s * unit, z: z2, s: s };
        };
        // closer (negative z) => brighter
        st.depthAlpha = (z) => clamp(0.62 - z * 0.22, 0.28, 1);

        panel.addEventListener('pointermove', (e) => {
            const r = panel.getBoundingClientRect();
            st.tYaw = ((e.clientX - r.left) / r.width - 0.5) * 1.6;
            st.tPitch = ((e.clientY - r.top) / r.height - 0.5) * 0.9;
        });
        panel.addEventListener('pointerleave', () => { st.tYaw = 0; st.tPitch = 0; });

        resize();
        const visual = factory(st, panel);

        function renderFrame(dt) {
            st.pal = palette();
            st.auto += dt * 0.28;
            st.offYaw += (st.tYaw - st.offYaw) * Math.min(1, dt * 4);
            st.offPitch += (st.tPitch - st.offPitch) * Math.min(1, dt * 4);
            st.ry = st.auto + st.offYaw;
            st.rp = 0.28 + st.offPitch;
            st.ctx.clearRect(0, 0, st.w, st.h);
            visual.draw(dt);
        }

        if (reduceMotion) {            // static frame, no loop
            for (let i = 0; i < 40; i++) renderFrame(0.05);
            new ResizeObserver(() => { resize(); renderFrame(0); }).observe(panel);
            return;
        }

        new ResizeObserver(resize).observe(panel);
        renderFrame(0.016);   // pehla frame turant, taaki panel blank na dikhe

        // sirf tab chalao jab panel screen par ho
        let running = false, last = 0;
        function loop(now) {
            if (!running) return;
            const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
            last = now;
            renderFrame(dt);
            requestAnimationFrame(loop);
        }
        const io = new IntersectionObserver((entries) => {
            const vis = entries[0].isIntersecting;
            if (vis && !running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
            else if (!vis) running = false;
        }, { threshold: 0.01 });
        io.observe(panel);
    }

    function glowDot(ctx, x, y, r, rgb, alpha) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
        g.addColorStop(0, `rgba(${rgb},${alpha})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 6.2832); ctx.fill();
    }

    function hudBox(panel, html) {
        const el = document.createElement('div');
        el.className = 'viz-hud';
        el.innerHTML = html;
        panel.appendChild(el);
        return el;
    }

    /* ==================================================================
       VISUAL 1 : 3D NEURAL NETWORK (forward-pass pulses + training HUD)
       ================================================================== */
    function neuralNet(st, panel) {
        const layers = [4, 6, 6, 3];
        const nodes = [], edges = [], edgeAt = {};
        const L = layers.length;

        layers.forEach((n, l) => {
            const r = 0.28 + 0.1 * n;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2 + l * 0.5;
                nodes.push({ l, x: (l - (L - 1) / 2) * 1.1, y: Math.cos(a) * r, z: Math.sin(a) * r, act: 0 });
            }
        });
        const byLayer = layers.map((_, l) => nodes.map((n, i) => (n.l === l ? i : -1)).filter((i) => i >= 0));
        for (let l = 0; l < L - 1; l++) {
            byLayer[l].forEach((a) => byLayer[l + 1].forEach((b) => {
                const e = { a, b, glow: 0 }; edges.push(e); edgeAt[a * 100 + b] = e;
            }));
        }

        const pulses = [];
        let spawn = 0;
        function spawnPulse() {
            const path = [byLayer[0][Math.floor(Math.random() * byLayer[0].length)]];
            for (let l = 1; l < L; l++) path.push(byLayer[l][Math.floor(Math.random() * byLayer[l].length)]);
            nodes[path[0]].act = 1;
            pulses.push({ path, seg: 0, t: 0 });
        }

        /* HUD : fake-but-illustrative training run */
        const hud = hudBox(panel, '<div><span class="live-dot"></span> training <i>(illustrative)</i></div><div>epoch <b data-k="ep">0</b></div><div>loss <b data-k="loss">0.000</b></div><div>acc <b data-k="acc">0.0%</b></div>');
        const kEp = hud.querySelector('[data-k="ep"]'), kLoss = hud.querySelector('[data-k="loss"]'), kAcc = hud.querySelector('[data-k="acc"]');
        const spark = document.createElement('div');
        spark.className = 'viz-spark';
        spark.innerHTML = '<svg viewBox="0 0 120 40" preserveAspectRatio="none"><polyline fill="none" stroke="var(--accent)" stroke-width="1.6" stroke-linejoin="round" points=""/></svg>';
        panel.appendChild(spark);
        const line = spark.querySelector('polyline');
        const lab = document.createElement('div');
        lab.className = 'viz-label'; lab.textContent = 'move your cursor to rotate';
        panel.appendChild(lab);

        let epoch = 0, hudT = 0; const hist = [];
        function lossAt(ep) { return 0.07 + 1.05 * Math.exp(-ep / 38) + (Math.random() - 0.5) * 0.025 * Math.exp(-ep / 90); }
        function hudStep() {
            epoch = (epoch + 1) % 220;
            if (epoch === 0) hist.length = 0;
            const loss = lossAt(epoch);
            hist.push(loss); if (hist.length > 60) hist.shift();
            kEp.textContent = epoch;
            kLoss.textContent = loss.toFixed(3);
            kAcc.textContent = clamp(100 - loss * 55 - 3, 38, 99.2).toFixed(1) + '%';
            const maxV = 1.2, n = hist.length;
            line.setAttribute('points', hist.map((v, i) => ((i / 59) * 120).toFixed(1) + ',' + (38 - (v / maxV) * 36).toFixed(1)).join(' '));
        }
        for (let i = 0; i < 18; i++) hudStep();

        return {
            draw(dt) {
                const ctx = st.ctx, P = st.pal;

                /* update */
                spawn -= dt;
                if (spawn <= 0) { spawnPulse(); spawn = 0.32 + Math.random() * 0.3; }
                hudT += dt; if (hudT > 0.12) { hudT = 0; hudStep(); }
                const decay = Math.exp(-dt * 2.4);
                nodes.forEach((n) => { n.act *= decay; });
                edges.forEach((e) => { e.glow *= decay; });
                for (let i = pulses.length - 1; i >= 0; i--) {
                    const p = pulses[i];
                    p.t += dt * 1.5;
                    const ed = edgeAt[p.path[p.seg] * 100 + p.path[p.seg + 1]];
                    if (ed) ed.glow = 1;
                    if (p.t >= 1) {
                        p.t = 0; p.seg++;
                        nodes[p.path[p.seg]].act = 1;
                        if (p.seg >= p.path.length - 1) pulses.splice(i, 1);
                    }
                }

                /* project */
                const pr = nodes.map((n) => st.project(n.x, n.y, n.z));

                /* edges */
                edges.forEach((e) => {
                    const A = pr[e.a], B = pr[e.b];
                    const da = st.depthAlpha((A.z + B.z) / 2);
                    const alpha = (0.14 + 0.6 * e.glow) * da;
                    ctx.strokeStyle = `rgba(${e.glow > 0.05 ? P.a : P.dim},${alpha.toFixed(3)})`;
                    ctx.lineWidth = 0.6 + 1.6 * e.glow;
                    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
                });

                /* nodes + pulses, far -> near */
                const items = nodes.map((n, i) => ({ z: pr[i].z, node: n, p: pr[i] }));
                pulses.forEach((pl) => {
                    const A = pr[pl.path[pl.seg]], B = pr[pl.path[pl.seg + 1]];
                    items.push({ z: (A.z + B.z) / 2 - 0.01, pulse: { x: A.x + (B.x - A.x) * pl.t, y: A.y + (B.y - A.y) * pl.t, s: (A.s + B.s) / 2 } });
                });
                items.sort((a, b) => b.z - a.z);

                items.forEach((it) => {
                    if (it.node) {
                        const n = it.node, p = it.p, da = st.depthAlpha(p.z);
                        const rgb = n.l === 0 ? P.a : n.l === L - 1 ? P.c : P.b;
                        const r = 5.2 * p.s;
                        glowDot(ctx, p.x, p.y, r, rgb, (0.12 + 0.55 * n.act) * da);
                        ctx.fillStyle = `rgba(${rgb},${((0.55 + 0.45 * n.act) * da).toFixed(3)})`;
                        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
                        ctx.strokeStyle = `rgba(${P.ink},${(0.25 * da).toFixed(3)})`;
                        ctx.lineWidth = 0.8; ctx.stroke();
                    } else {
                        const q = it.pulse;
                        glowDot(ctx, q.x, q.y, 4 * q.s, P.a, 0.9);
                        ctx.fillStyle = `rgba(${P.ink},0.95)`;
                        ctx.beginPath(); ctx.arc(q.x, q.y, 2.1 * q.s, 0, 6.2832); ctx.fill();
                    }
                });
            }
        };
    }

    /* ==================================================================
       VISUAL 2 : 3D K-MEANS CLUSTERING
       ================================================================== */
    function kMeans(st, panel) {
        const K = 3, N = 150, MAX_ITER = 6, STEP = 0.95;
        st.zoom = 0.2;   // cube panel ke andar poora dikhe
        const centers = [[-0.8, -0.45, 0.3], [0.75, -0.35, -0.6], [0.05, 0.85, 0.6]];
        const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * v); };

        const pts = [];
        for (let i = 0; i < N; i++) {
            const c = centers[i % K];
            pts.push({ x: c[0] + gauss() * 0.27, y: c[1] + gauss() * 0.27, z: c[2] + gauss() * 0.27, k: -1 });
        }
        const cent = [];
        function resetCentroids() {
            cent.length = 0;
            for (let k = 0; k < K; k++) {
                const x = (Math.random() * 2 - 1) * 0.9, y = (Math.random() * 2 - 1) * 0.9, z = (Math.random() * 2 - 1) * 0.9;
                cent.push({ x, y, z, tx: x, ty: y, tz: z });
            }
            pts.forEach((p) => { p.k = -1; });
        }
        resetCentroids();

        let iter = 0, timer = 0.5, hold = 0, inertia = 0;

        const hud = hudBox(panel, '<div>KMeans <i>(illustrative)</i></div><div>k = <b>3</b></div><div>iter <b data-k="it">0</b>/' + MAX_ITER + '</div><div>inertia <b data-k="in">-</b></div>');
        const kIt = hud.querySelector('[data-k="it"]'), kIn = hud.querySelector('[data-k="in"]');
        const lab = document.createElement('div');
        lab.className = 'viz-label'; lab.textContent = 'move your cursor to rotate';
        panel.appendChild(lab);

        function step() {
            // 1) assign
            inertia = 0;
            pts.forEach((p) => {
                let best = 0, bd = 1e9;
                cent.forEach((c, k) => {
                    const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2 + (p.z - c.z) ** 2;
                    if (d < bd) { bd = d; best = k; }
                });
                p.k = best; inertia += bd;
            });
            // 2) move centroids to cluster means
            cent.forEach((c, k) => {
                let sx = 0, sy = 0, sz = 0, n = 0;
                pts.forEach((p) => { if (p.k === k) { sx += p.x; sy += p.y; sz += p.z; n++; } });
                if (n) { c.tx = sx / n; c.ty = sy / n; c.tz = sz / n; }
            });
            iter++;
            kIt.textContent = iter;
            kIn.textContent = inertia.toFixed(1);
        }

        const box = [];
        for (const x of [-1.25, 1.25]) for (const y of [-1.25, 1.25]) for (const z of [-1.25, 1.25]) box.push([x, y, z]);
        const boxEdges = [];
        for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
            const d = (box[i][0] !== box[j][0]) + (box[i][1] !== box[j][1]) + (box[i][2] !== box[j][2]);
            if (d === 1) boxEdges.push([i, j]);
        }

        return {
            draw(dt) {
                const ctx = st.ctx, P = st.pal, cols = [P.a, P.b, P.c];

                /* update */
                if (iter < MAX_ITER) {
                    timer -= dt;
                    if (timer <= 0) { step(); timer = STEP; }
                } else {
                    hold += dt;
                    if (hold > 2.4) { hold = 0; iter = 0; timer = 0.6; resetCentroids(); kIt.textContent = 0; kIn.textContent = '-'; }
                }
                const k = 1 - Math.exp(-dt * 5);
                cent.forEach((c) => { c.x += (c.tx - c.x) * k; c.y += (c.ty - c.y) * k; c.z += (c.tz - c.z) * k; });

                /* wireframe cube (3D feel) */
                const bp = box.map((b) => st.project(b[0], b[1], b[2]));
                ctx.lineWidth = 1;
                boxEdges.forEach(([i, j]) => {
                    ctx.strokeStyle = `rgba(${P.dim},${(0.16 * st.depthAlpha((bp[i].z + bp[j].z) / 2)).toFixed(3)})`;
                    ctx.beginPath(); ctx.moveTo(bp[i].x, bp[i].y); ctx.lineTo(bp[j].x, bp[j].y); ctx.stroke();
                });

                const pp = pts.map((p) => st.project(p.x, p.y, p.z));
                const cp = cent.map((c) => st.project(c.x, c.y, c.z));

                /* pull lines point -> centroid */
                ctx.lineWidth = 0.7;
                pts.forEach((p, i) => {
                    if (p.k < 0) return;
                    ctx.strokeStyle = `rgba(${cols[p.k]},0.10)`;
                    ctx.beginPath(); ctx.moveTo(pp[i].x, pp[i].y); ctx.lineTo(cp[p.k].x, cp[p.k].y); ctx.stroke();
                });

                /* points + centroids, far -> near */
                const items = pts.map((p, i) => ({ z: pp[i].z, pt: p, q: pp[i] }));
                cent.forEach((c, i) => items.push({ z: cp[i].z - 0.02, cen: i, q: cp[i] }));
                items.sort((a, b) => b.z - a.z);

                items.forEach((it) => {
                    const q = it.q, da = st.depthAlpha(q.z);
                    if (it.pt) {
                        const rgb = it.pt.k < 0 ? P.dim : cols[it.pt.k];
                        ctx.fillStyle = `rgba(${rgb},${(0.9 * da).toFixed(3)})`;
                        ctx.beginPath(); ctx.arc(q.x, q.y, 3.1 * q.s, 0, 6.2832); ctx.fill();
                    } else {
                        const rgb = cols[it.cen], r = 8.5 * q.s;
                        glowDot(ctx, q.x, q.y, r, rgb, 0.7);
                        ctx.fillStyle = `rgba(${P.ink},0.95)`;
                        ctx.beginPath(); ctx.arc(q.x, q.y, r * 0.55, 0, 6.2832); ctx.fill();
                        ctx.strokeStyle = `rgba(${rgb},1)`; ctx.lineWidth = 2.2;
                        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.2832); ctx.stroke();
                    }
                });
            }
        };
    }

    const VISUALS = { neuralnet: neuralNet, kmeans: kMeans };

    function initVisuals() {
        $$('.viz-panel').forEach((panel) => {
            const f = VISUALS[panel.getAttribute('data-visual')];
            if (f) createStage(panel, f);
        });
    }

    /* ---------- run ---------- */
    initReveal();
    initTilt();
    initRotate();
    initCounters();
    initOrbit();
    initVisuals();
})();
