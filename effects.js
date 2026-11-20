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

    /* ==================================================================
       Shared helpers for the algorithm visuals
       ================================================================== */
    const TAU = Math.PI * 2;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const gaussR = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
    const rand = (a, b) => a + Math.random() * (b - a);

    const CUBE = (() => {
        const c = [];
        for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) c.push([x, y, z]);
        const e = [];
        for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
            const d = (c[i][0] !== c[j][0]) + (c[i][1] !== c[j][1]) + (c[i][2] !== c[j][2]);
            if (d === 1) e.push([i, j]);
        }
        return { c, e };
    })();

    function cubeWire(st, s, a) {
        const ctx = st.ctx, P = st.pal;
        const pr = CUBE.c.map((c) => st.project(c[0] * s, c[1] * s, c[2] * s));
        ctx.lineWidth = 1;
        CUBE.e.forEach(([i, j]) => {
            ctx.strokeStyle = `rgba(${P.dim},${((a || 0.16) * st.depthAlpha((pr[i].z + pr[j].z) / 2)).toFixed(3)})`;
            ctx.beginPath(); ctx.moveTo(pr[i].x, pr[i].y); ctx.lineTo(pr[j].x, pr[j].y); ctx.stroke();
        });
    }

    function disc(ctx, q, r, rgb, alpha) {
        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
    }

    function rotateLabel(panel) {
        const lab = document.createElement('div');
        lab.className = 'viz-label'; lab.textContent = 'move your cursor to rotate';
        panel.appendChild(lab);
    }

    /* ==================================================================
       VISUAL 3 : RANDOM FOREST  (ensemble learning - 5 trees vote)
       ================================================================== */
    function forest(st, panel) {
        st.zoom = 0.255;
        const T = 5, R = 1.1, CYCLE = 6.2;
        const offs = [[0], [-0.2, 0.2], [-0.33, -0.11, 0.11, 0.33]];
        const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
        const names = ['A', 'B', 'C'];
        const trees = [];
        for (let i = 0; i < T; i++) {
            const th = (i / T) * TAU, rx = Math.cos(th), rz = Math.sin(th), tx = -rz, tz = rx, nodes = [];
            offs.forEach((arr, l) => arr.forEach((o) => nodes.push({ x: rx * R + tx * o, y: -0.55 + l * 0.5, z: rz * R + tz * o })));
            trees.push({ nodes, path: [0, 1, 3], cls: 0 });
        }
        const hub = { x: 0, y: 0.15, z: 0 };
        let t = 0, truth = 0, lastKey = '';

        const hud = hudBox(panel, '<div>Random Forest <i>(illustrative)</i></div><div>trees <b>5</b></div><div>votes <b data-k="v">-</b></div><div>prediction <b data-k="p">?</b></div>');
        const kV = hud.querySelector('[data-k="v"]'), kP = hud.querySelector('[data-k="p"]');
        rotateLabel(panel);

        function newRound() {
            t = 0; truth = Math.floor(Math.random() * 3);
            trees.forEach((tr) => {
                const m = Math.random() < 0.5 ? 1 : 2;
                tr.path = [0, m, (m === 1 ? 3 : 5) + (Math.random() < 0.5 ? 0 : 1)];
                tr.cls = Math.random() < 0.72 ? truth : (truth + 1 + Math.floor(Math.random() * 2)) % 3;
            });
        }
        newRound();

        return {
            draw(dt) {
                const ctx = st.ctx, P = st.pal, cols = [P.a, P.b, P.c];
                t += dt; if (t > CYCLE) newRound();

                const pr = trees.map((tr) => tr.nodes.map((n) => st.project(n.x, n.y, n.z)));
                const hp = st.project(hub.x, hub.y, hub.z);
                const counts = [0, 0, 0], items = [];

                trees.forEach((tr, i) => {
                    const u = t - (0.3 + i * 0.45);
                    const desc = clamp(u / 1.0, 0, 1), toHub = clamp((u - 1.0) / 0.7, 0, 1);
                    if (toHub >= 1) counts[tr.cls]++;
                    const col = cols[tr.cls], N = pr[i];

                    /* tree skeleton */
                    ctx.lineWidth = 1;
                    edges.forEach(([a, b]) => {
                        ctx.strokeStyle = `rgba(${P.dim},${(0.2 * st.depthAlpha((N[a].z + N[b].z) / 2)).toFixed(3)})`;
                        ctx.beginPath(); ctx.moveTo(N[a].x, N[a].y); ctx.lineTo(N[b].x, N[b].y); ctx.stroke();
                    });
                    /* lit decision path */
                    if (u > 0) {
                        ctx.strokeStyle = `rgba(${col},0.9)`; ctx.lineWidth = 2.2;
                        for (let s = 0; s < 2; s++) {
                            const sp = clamp(desc * 2 - s, 0, 1); if (sp <= 0) continue;
                            const A = N[tr.path[s]], B = N[tr.path[s + 1]];
                            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(A.x + (B.x - A.x) * sp, A.y + (B.y - A.y) * sp); ctx.stroke();
                        }
                    }
                    /* leaf -> hub link + pulse */
                    const leaf = N[tr.path[2]];
                    if (toHub > 0) {
                        ctx.strokeStyle = `rgba(${col},0.22)`; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(leaf.x, leaf.y); ctx.lineTo(hp.x, hp.y); ctx.stroke();
                    }
                    /* nodes */
                    N.forEach((q, ni) => {
                        const isLeaf = ni === tr.path[2], lit = isLeaf && desc >= 1;
                        items.push({ z: q.z, q, r: (lit ? 6 : 3.4) * q.s, rgb: lit ? col : P.dim, a: lit ? 0.95 : 0.55, glow: lit });
                    });
                    /* pulses */
                    if (desc > 0 && desc < 1) {
                        const si = desc < 0.5 ? 0 : 1, lt = desc < 0.5 ? desc * 2 : desc * 2 - 1;
                        const A = N[tr.path[si]], B = N[tr.path[si + 1]];
                        items.push({ z: (A.z + B.z) / 2 - 0.02, q: { x: A.x + (B.x - A.x) * lt, y: A.y + (B.y - A.y) * lt, s: A.s }, r: 4.5 * A.s, rgb: col, a: 1, glow: true, pulse: true });
                    }
                    if (toHub > 0 && toHub < 1) {
                        items.push({ z: (leaf.z + hp.z) / 2 - 0.02, q: { x: leaf.x + (hp.x - leaf.x) * toHub, y: leaf.y + (hp.y - leaf.y) * toHub, s: leaf.s }, r: 4.5 * leaf.s, rgb: col, a: 1, glow: true, pulse: true });
                    }
                });

                /* hub = the voting result */
                const total = counts[0] + counts[1] + counts[2];
                let maj = 0; counts.forEach((c, k) => { if (c > counts[maj]) maj = k; });
                items.push({ z: hp.z, q: hp, r: (9 + total * 2.2) * hp.s, rgb: total ? cols[maj] : P.dim, a: total ? 0.95 : 0.5, glow: true, hub: true });

                items.sort((a, b) => b.z - a.z);
                items.forEach((it) => {
                    const da = st.depthAlpha(it.z);
                    if (it.glow) glowDot(ctx, it.q.x, it.q.y, it.r, it.rgb, (it.hub ? 0.55 : 0.6) * da);
                    disc(ctx, it.q, it.r, it.rgb, it.a * (it.pulse ? 1 : da));
                    if (it.hub) { ctx.strokeStyle = `rgba(${P.ink},0.5)`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(it.q.x, it.q.y, it.r + 4, 0, TAU); ctx.stroke(); }
                });

                const key = counts.join(',');
                if (key !== lastKey) {
                    lastKey = key;
                    kV.textContent = total ? counts.map((c, k) => names[k] + ':' + c).join('  ') : '-';
                    kP.textContent = total === T ? 'class ' + names[maj] : '?';
                }
            }
        };
    }

    /* ==================================================================
       VISUAL 4 : PCA  (3D cloud flattens onto its principal plane)
       ================================================================== */
    function pcaVisual(st, panel) {
        st.zoom = 0.21;
        const sig = [0.95, 0.42, 0.13], CYCLE = 8;
        const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
        const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        const e1 = norm([0.8, 0.35, 0.5]);
        let e2 = [-0.3, 0.9, -0.2]; const d12 = dot(e2, e1); e2 = norm([e2[0] - d12 * e1[0], e2[1] - d12 * e1[1], e2[2] - d12 * e1[2]]);
        const e3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        const at = (a, b, c) => [e1[0] * a + e2[0] * b + e3[0] * c, e1[1] * a + e2[1] * b + e3[1] * c, e1[2] * a + e2[2] * b + e3[2] * c];

        const pts = [];
        for (let i = 0; i < 170; i++) {
            const a = clamp(gaussR() * sig[0], -1.6, 1.6), b = clamp(gaussR() * sig[1], -0.8, 0.8), c = clamp(gaussR() * sig[2], -0.3, 0.3);
            pts.push({ a, b, c, g: a < -0.35 ? 0 : a > 0.35 ? 2 : 1 });
        }
        const kept = ((sig[0] ** 2 + sig[1] ** 2) / (sig[0] ** 2 + sig[1] ** 2 + sig[2] ** 2) * 100).toFixed(1);

        const hud = hudBox(panel, '<div>PCA <i>(illustrative)</i></div><div>dims <b>3 → 2</b></div><div>variance kept <b>' + kept + '%</b></div><div>stage <b data-k="s">original</b></div>');
        const kS = hud.querySelector('[data-k="s"]');
        rotateLabel(panel);
        let t = 0, lastS = '';

        return {
            draw(dt) {
                const ctx = st.ctx, P = st.pal, cols = [P.a, P.b, P.c];
                t += dt; if (t > CYCLE) t = 0;
                const m = t < 1.4 ? 0 : t < 3.4 ? ease((t - 1.4) / 2) : t < 6 ? 1 : t < 7.6 ? 1 - ease((t - 6) / 1.6) : 0;
                const axA = clamp(t / 1.2, 0, 1);
                const stage = m >= 1 ? 'projected' : m > 0 ? (t < 5 ? 'projecting' : 'restoring') : 'original';
                if (stage !== lastS) { lastS = stage; kS.textContent = stage; }

                cubeWire(st, 1.4, 0.12);

                /* principal plane (PC1 x PC2) */
                const q = [[1.5, 0.85], [1.5, -0.85], [-1.5, -0.85], [-1.5, 0.85]].map(([a, b]) => { const v = at(a, b, 0); return st.project(v[0], v[1], v[2]); });
                ctx.fillStyle = `rgba(${P.a},${(0.05 + 0.08 * m).toFixed(3)})`;
                ctx.strokeStyle = `rgba(${P.a},${(0.18 + 0.4 * m).toFixed(3)})`; ctx.lineWidth = 1.2;
                ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); ctx.stroke();

                /* principal axes */
                ctx.font = '600 11px "Fira Code", monospace'; ctx.textAlign = 'center';
                [[1.6, 0], [1.0, 1], [0.55, 2]].forEach(([L, k]) => {
                    const d = [[1, 0, 0], [0, 1, 0], [0, 0, 1]][k];
                    const p0 = at(-d[0] * L, -d[1] * L, -d[2] * L), p1 = at(d[0] * L, d[1] * L, d[2] * L);
                    const a = st.project(p0[0], p0[1], p0[2]), b = st.project(p1[0], p1[1], p1[2]);
                    const al = axA * (k === 2 ? 1 - 0.65 * m : 0.9);
                    ctx.strokeStyle = `rgba(${cols[k]},${al.toFixed(3)})`; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                    ctx.fillStyle = `rgba(${cols[k]},${al.toFixed(3)})`;
                    ctx.fillText('PC' + (k + 1), b.x, b.y - 8);
                });

                /* points */
                const items = pts.map((p) => {
                    const v = at(p.a, p.b, p.c * (1 - m));
                    return { z: 0, p, q: st.project(v[0], v[1], v[2]), v0: at(p.a, p.b, p.c) };
                });
                items.forEach((it) => { it.z = it.q.z; });
                if (m > 0 && m < 1) {
                    ctx.lineWidth = 0.7;
                    items.forEach((it) => {
                        const o = st.project(it.v0[0], it.v0[1], it.v0[2]);
                        ctx.strokeStyle = `rgba(${cols[it.p.g]},0.18)`;
                        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(it.q.x, it.q.y); ctx.stroke();
                    });
                }
                items.sort((a, b) => b.z - a.z);
                items.forEach((it) => disc(ctx, it.q, 3.2 * it.q.s, cols[it.p.g], 0.9 * st.depthAlpha(it.z)));
            }
        };
    }

    /* ==================================================================
       VISUAL 5 : DBSCAN  (density-based clusters + noise)
       ================================================================== */
    function dbscanVisual(st, panel) {
        st.zoom = 0.24;
        const EPS = 0.26, MINPTS = 4, STEP = 0.04;
        const pts = [];
        for (let i = 0; i < 64; i++) {            // tilted ring
            const th = (i / 64) * TAU + rand(-0.04, 0.04), r = 0.72 + gaussR() * 0.035;
            pts.push({ x: -0.5 + r * Math.cos(th) + gaussR() * 0.03, y: -0.05 + r * Math.sin(th) * 0.5 + gaussR() * 0.03, z: r * Math.sin(th) * 0.87 + gaussR() * 0.03 });
        }
        for (let i = 0; i < 64; i++) pts.push({ x: 0.75 + gaussR() * 0.2, y: 0.1 + gaussR() * 0.2, z: 0.1 + gaussR() * 0.2 });
        for (let i = 0; i < 20; i++) pts.push({ x: rand(-1.1, 1.1), y: rand(-1.1, 1.1), z: rand(-1.1, 1.1) });

        /* real DBSCAN, run once; `order` = the order points get claimed by a cluster */
        const n = pts.length, label = new Array(n).fill(-1), vis = new Array(n).fill(false), order = [];
        const region = (i) => { const r = []; for (let j = 0; j < n; j++) if (Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y, pts[i].z - pts[j].z) <= EPS) r.push(j); return r; };
        let cid = -1;
        for (let i = 0; i < n; i++) {
            if (vis[i]) continue; vis[i] = true;
            const nb = region(i); if (nb.length < MINPTS) continue;
            cid++; label[i] = cid; order.push(i);
            const queue = nb.slice();
            while (queue.length) {
                const j = queue.shift();
                if (label[j] === -1) { label[j] = cid; order.push(j); }
                if (vis[j]) continue; vis[j] = true;
                const nj = region(j);
                if (nj.length >= MINPTS) nj.forEach((k) => { if (!queue.includes(k)) queue.push(k); });
            }
        }
        const when = new Array(n).fill(-1); order.forEach((p, k) => { when[p] = k * STEP; });
        const total = Math.max(1, order.length) * STEP, CYCLE = total + 3.6;

        const hud = hudBox(panel, '<div>DBSCAN <i>(illustrative)</i></div><div>eps <b>' + EPS + '</b> · minPts <b>' + MINPTS + '</b></div><div>clusters <b data-k="c">0</b></div><div>noise <b data-k="n">0</b></div>');
        const kC = hud.querySelector('[data-k="c"]'), kN = hud.querySelector('[data-k="n"]');
        rotateLabel(panel);
        let t = 0, lastKey = '';

        return {
            draw(dt) {
                const ctx = st.ctx, P = st.pal, cols = [P.a, P.b, P.c, P.d];
                t += dt; if (t > CYCLE) t = 0;
                const idx = Math.min(order.length - 1, Math.floor(t / STEP));
                const showNoise = t > total + 0.4;

                cubeWire(st, 1.25, 0.12);
                const pp = pts.map((p) => st.project(p.x, p.y, p.z));

                /* eps-neighbourhood ring around the point being expanded */
                if (t < total && order.length) {
                    const f = order[idx], q = pp[f];
                    const rpx = EPS * Math.min(st.w, st.h) * st.zoom * q.s;
                    ctx.strokeStyle = `rgba(${cols[label[f] % 3]},0.55)`; ctx.lineWidth = 1.4;
                    ctx.beginPath(); ctx.arc(q.x, q.y, rpx, 0, TAU); ctx.stroke();
                    ctx.fillStyle = `rgba(${cols[label[f] % 3]},0.07)`; ctx.fill();
                }

                const items = pts.map((p, i) => ({ z: pp[i].z, i }));
                items.sort((a, b) => b.z - a.z);
                let found = 0, noiseShown = 0;
                items.forEach(({ i }) => {
                    const q = pp[i], da = st.depthAlpha(q.z), done = when[i] >= 0 && t >= when[i];
                    if (done) { disc(ctx, q, 3.4 * q.s, cols[label[i] % 3], 0.95 * da); if (label[i] + 1 > found) found = label[i] + 1; }
                    else if (label[i] < 0 && showNoise) {
                        noiseShown++;
                        const r = 3.6 * q.s; ctx.strokeStyle = `rgba(${P.d},${(0.9 * da).toFixed(3)})`; ctx.lineWidth = 1.6;
                        ctx.beginPath(); ctx.moveTo(q.x - r, q.y - r); ctx.lineTo(q.x + r, q.y + r); ctx.moveTo(q.x + r, q.y - r); ctx.lineTo(q.x - r, q.y + r); ctx.stroke();
                    } else disc(ctx, q, 2.8 * q.s, P.dim, 0.7 * da);
                });
                const key = found + '/' + noiseShown;
                if (key !== lastKey) { lastKey = key; kC.textContent = found; kN.textContent = noiseShown; }
            }
        };
    }

    /* ==================================================================
       VISUAL 6 : KNN  (query point asks its k nearest neighbours)
       ================================================================== */
    function knnVisual(st, panel) {
        st.zoom = 0.21;
        const K = 5, CYCLE = 5.2, names = ['A', 'B', 'C'];
        const cs = [[-0.7, -0.3, 0.2], [0.65, -0.4, -0.3], [0.0, 0.7, 0.5]];
        const pts = [];
        for (let i = 0; i < 105; i++) { const c = cs[i % 3]; pts.push({ x: c[0] + gaussR() * 0.34, y: c[1] + gaussR() * 0.34, z: c[2] + gaussR() * 0.34, k: i % 3 }); }

        const hud = hudBox(panel, '<div>K-Nearest Neighbors <i>(illustrative)</i></div><div>k = <b>' + K + '</b></div><div>votes <b data-k="v">-</b></div><div>class <b data-k="c">?</b></div>');
        const kV = hud.querySelector('[data-k="v"]'), kC = hud.querySelector('[data-k="c"]');
        rotateLabel(panel);

        let qy = null, t = 0, decidedShown = false;
        function newQuery() {
            const x = rand(-0.8, 0.8), y = rand(-0.7, 0.7), z = rand(-0.7, 0.7);
            const sorted = pts.map((p) => ({ p, d: Math.hypot(p.x - x, p.y - y, p.z - z) })).sort((a, b) => a.d - b.d).slice(0, K).map((o) => o.p);
            const votes = [0, 0, 0]; sorted.forEach((p) => votes[p.k]++);
            let win = 0; votes.forEach((v, k) => { if (v > votes[win]) win = k; });
            qy = { x, y, z, nb: sorted, votes, win }; t = 0; decidedShown = false;
            kV.textContent = '-'; kC.textContent = '?';
        }

        return {
            draw(dt) {
                const ctx = st.ctx, P = st.pal, cols = [P.a, P.b, P.c];
                t += dt; if (!qy || t > CYCLE) newQuery();
                const appear = clamp(t / 0.7, 0, 1), lineP = ease(clamp((t - 0.9) / 1.1, 0, 1)), decided = t > 2.3;
                const fade = t > CYCLE - 0.6 ? clamp((CYCLE - t) / 0.6, 0, 1) : 1;
                if (decided && !decidedShown) { decidedShown = true; kV.textContent = qy.votes.map((v, k) => names[k] + ':' + v).join('  '); kC.textContent = names[qy.win]; }

                cubeWire(st, 1.2, 0.12);
                const pp = pts.map((p) => st.project(p.x, p.y, p.z));
                const Q = st.project(qy.x, qy.y, qy.z);

                /* lines query -> neighbours */
                if (lineP > 0) {
                    ctx.lineWidth = 1.4;
                    qy.nb.forEach((p) => {
                        const B = pp[pts.indexOf(p)];
                        ctx.strokeStyle = `rgba(${cols[p.k]},${(0.8 * fade).toFixed(3)})`;
                        ctx.beginPath(); ctx.moveTo(Q.x, Q.y); ctx.lineTo(Q.x + (B.x - Q.x) * lineP, Q.y + (B.y - Q.y) * lineP); ctx.stroke();
                    });
                }

                const items = pts.map((p, i) => ({ z: pp[i].z, p, q: pp[i] }));
                items.push({ z: Q.z - 0.02, query: true, q: Q });
                items.sort((a, b) => b.z - a.z);
                items.forEach((it) => {
                    const da = st.depthAlpha(it.z), q = it.q;
                    if (it.query) {
                        const rgb = decided ? cols[qy.win] : P.ink, r = 8 * q.s * appear;
                        glowDot(ctx, q.x, q.y, r, rgb, 0.8 * fade * appear);
                        disc(ctx, q, r, rgb, 0.98 * fade * appear);
                        ctx.strokeStyle = `rgba(${P.ink},${(0.7 * fade * appear).toFixed(3)})`; ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.arc(q.x, q.y, r + 4, 0, TAU); ctx.stroke();
                    } else {
                        const isNb = lineP > 0.6 && qy.nb.indexOf(it.p) >= 0;
                        disc(ctx, q, (isNb ? 4.8 : 3.1) * q.s, cols[it.p.k], (isNb ? 1 : 0.8) * da);
                        if (isNb) { ctx.strokeStyle = `rgba(${P.ink},${(0.6 * da).toFixed(3)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, 7 * q.s, 0, TAU); ctx.stroke(); }
                    }
                });
            }
        };
    }

    /* ==================================================================
       VISUAL 7 : LINEAR REGRESSION  (plane fitted by gradient descent)
       ================================================================== */
    function regressionVisual(st, panel) {
        st.zoom = 0.25;
        const TRUE = { a: 0.55, b: -0.4, c: 0.1 }, N = 70, CYCLE = 6.5, LR = 0.3, SPS = 8;
        const pts = [];
        for (let i = 0; i < N; i++) { const x = rand(-1, 1), y = rand(-1, 1); pts.push({ x, y, z: TRUE.a * x + TRUE.b * y + TRUE.c + gaussR() * 0.12 }); }

        const hud = hudBox(panel, '<div>Linear Regression <i>(illustrative)</i></div><div>step <b data-k="s">0</b></div><div>MSE <b data-k="m">-</b></div><div>method <b>gradient descent</b></div>');
        const kS = hud.querySelector('[data-k="s"]'), kM = hud.querySelector('[data-k="m"]');
        rotateLabel(panel);

        let w, shown, t, acc, step;
        function reset() {
            w = { a: rand(-0.9, 0.9), b: rand(-0.9, 0.9), c: rand(-0.7, 0.7) };
            shown = { a: w.a, b: w.b, c: w.c }; t = 0; acc = 0; step = 0;
        }
        reset();
        const mse = (p) => pts.reduce((s, q) => s + (p.a * q.x + p.b * q.y + p.c - q.z) ** 2, 0) / N;
        function gd() {
            let da = 0, db = 0, dc = 0;
            pts.forEach((q) => { const e = w.a * q.x + w.b * q.y + w.c - q.z; da += 2 * e * q.x; db += 2 * e * q.y; dc += 2 * e; });
            w.a -= LR * da / N; w.b -= LR * db / N; w.c -= LR * dc / N; step++;
        }

        return {
            draw(dt) {
                const ctx = st.ctx, P = st.pal;
                t += dt; if (t > CYCLE) reset();
                acc += dt * SPS; while (acc >= 1) { acc -= 1; if (t < CYCLE - 1.8) gd(); }
                const k = 1 - Math.exp(-dt * 10);
                shown.a += (w.a - shown.a) * k; shown.b += (w.b - shown.b) * k; shown.c += (w.c - shown.c) * k;
                kS.textContent = step; kM.textContent = mse(shown).toFixed(3);

                /* vertical axis = target value (so screen-up = bigger) */
                const pos = (x, y, z) => st.project(x, -z, y);
                cubeWire(st, 1.25, 0.12);

                /* plane mesh */
                const G = 6;
                ctx.lineWidth = 1;
                for (let i = 0; i <= G; i++) {
                    const u = -1 + (2 * i) / G;
                    const line = (fx) => {
                        ctx.beginPath();
                        for (let j = 0; j <= G; j++) { const v = -1 + (2 * j) / G, x = fx ? u : v, y = fx ? v : u, p = pos(x, y, shown.a * x + shown.b * y + shown.c); j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); }
                        ctx.strokeStyle = `rgba(${P.a},0.55)`; ctx.stroke();
                    };
                    line(true); line(false);
                }

                /* residuals + points */
                const items = pts.map((q) => ({ q, p: pos(q.x, q.y, q.z), f: pos(q.x, q.y, shown.a * q.x + shown.b * q.y + shown.c) }));
                items.forEach((it) => { it.z = it.p.z; });
                ctx.lineWidth = 1;
                items.forEach((it) => { ctx.strokeStyle = `rgba(${P.d},0.35)`; ctx.beginPath(); ctx.moveTo(it.p.x, it.p.y); ctx.lineTo(it.f.x, it.f.y); ctx.stroke(); });
                items.sort((a, b) => b.z - a.z);
                items.forEach((it) => disc(ctx, it.p, 3.4 * it.p.s, P.c, 0.95 * st.depthAlpha(it.z)));
            }
        };
    }

    const VISUALS = { neuralnet: neuralNet, kmeans: kMeans, forest: forest, pca: pcaVisual, dbscan: dbscanVisual, knn: knnVisual, regression: regressionVisual };

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
