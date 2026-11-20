/* ==========================================================================
   QUADRA FLOW – RENDERER
   data.js ka content padh ke teeno pages ka HTML banata hai:
     index.html    -> Quadra Flow home (library cards)
     library.html  -> ek library ka home (?lib=<id>)
     docs.html     -> us library ke docs (?lib=<id>)
   Layout ke liye Tailwind CSS classes use hui hain; 3D / animation ka CSS
   style.css mein aur canvas animations effects.js mein hain.
   Is file ko normally edit karne ki zaroorat nahi.
   ========================================================================== */
(function () {
    'use strict';

    // data.js mein `const SITE_DATA` hai (window property nahi banti), isliye typeof se check
    const D = (typeof SITE_DATA !== 'undefined') ? SITE_DATA : null;
    if (!D) {
        console.error('SITE_DATA not found. Make sure data.js loads before render.js');
        return;
    }

    /* ---------- helpers ---------- */
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');   // `inline code`
    const mount = (id, html) => { const el = $(id); if (el) el.innerHTML = html; return el; };

    const PAGE = $('hubHero') ? 'hub' : $('libHero') ? 'library' : $('docsContent') ? 'docs' : '';

    /* ---------- libraries ---------- */
    const libs = D.libraries || [];
    const liveLibs = libs.filter((l) => l.status === 'live');
    const reqId = new URLSearchParams(location.search).get('lib');
    const lib = libs.find((l) => l.id === reqId) || liveLibs[0] || libs[0] || null;
    const defaultLib = liveLibs[0] || null;

    const libHref  = (l, hash) => `library.html?lib=${encodeURIComponent(l.id)}${hash || ''}`;
    const docsHref = (l, hash) => `docs.html?lib=${encodeURIComponent(l.id)}${hash || ''}`;
    const soonMsg  = (l) => `${l.name} is coming soon. Stay tuned!`;

    /* ---------- Python syntax highlighter ---------- */
    const KEYWORDS = new Set([
        'import', 'from', 'as', 'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while',
        'in', 'not', 'and', 'or', 'is', 'with', 'try', 'except', 'finally', 'raise', 'pass',
        'break', 'continue', 'lambda', 'yield', 'async', 'await', 'global', 'nonlocal',
        'True', 'False', 'None', 'print'
    ]);

    const TOKEN_RE = new RegExp([
        '(#[^\\n]*)',                                                       // 1 comment
        '("""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\')', // 2 string
        '(@[A-Za-z_][\\w.]*)',                                              // 3 decorator
        '(\\b\\d+(?:\\.\\d+)?\\b)',                                         // 4 number
        '(\\b[A-Za-z_]\\w*\\b)'                                             // 5 identifier
    ].join('|'), 'g');

    function highlight(source) {
        const src = String(source).replace(/^\n+|\s+$/g, '');
        let out = '', last = 0, expectName = false, m;
        TOKEN_RE.lastIndex = 0;
        while ((m = TOKEN_RE.exec(src)) !== null) {
            const gap = src.slice(last, m.index);
            out += esc(gap);
            if (gap.trim() !== '') expectName = false;
            last = m.index + m[0].length;

            if (m[1]) { out += `<span class="comment">${esc(m[1])}</span>`; expectName = false; }
            else if (m[2]) { out += `<span class="string">${esc(m[2])}</span>`; expectName = false; }
            else if (m[3]) { out += `<span class="decorator">${esc(m[3])}</span>`; expectName = false; }
            else if (m[4]) { out += `<span class="string">${esc(m[4])}</span>`; expectName = false; }
            else if (m[5]) {
                const w = m[5];
                if (KEYWORDS.has(w)) { out += `<span class="keyword">${w}</span>`; expectName = (w === 'def' || w === 'class'); }
                else if (expectName) { out += `<span class="function">${w}</span>`; expectName = false; }
                else out += esc(w);
            }
        }
        return out + esc(src.slice(last));
    }

    /* ---------- reusable components ---------- */
    function installBox(command) {
        return `
            <div class="install-box">
                <code>${esc(command)}</code>
                <button class="copy-btn" onclick="copyInstallCmd(this)" aria-label="Copy command">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <span class="toast">Copied!</span>
            </div>`;
    }

    function codeWindow(filename, source) {
        return `
            <div class="code-window">
                <div class="window-header">
                    <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
                    <span class="file-name">${esc(filename || 'example.py')}</span>
                    <button class="code-copy-btn" onclick="copyCodeBlock(this)"><i class="fa-regular fa-copy"></i> Copy</button>
                </div>
                <pre><code>${highlight(source)}</code></pre>
            </div>`;
    }

    // "Quadra Flow" -> Quadra + <gradient>Flow</gradient>  (beech mein space rehta hai)
    function brandHtml() {
        const parts = String(D.site.name).trim().split(/\s+/);
        if (parts.length < 2) return esc(D.site.name);
        return `${esc(parts[0])} <span class="brand-flow">${esc(parts.slice(1).join(' '))}</span>`;
    }

    const aurora = `<div class="aurora" aria-hidden="true"><i class="aurora-blob a1"></i><i class="aurora-blob a2"></i><i class="aurora-blob a3"></i></div>`;

    const sectionHead = (title, sub) => `
        <div class="mx-auto mb-12 max-w-2xl text-center reveal">
            <h2 class="text-3xl font-extrabold tracking-tight sm:text-4xl">${esc(title)}</h2>
            ${sub ? `<p class="mt-3 text-[color:var(--text-muted)]">${esc(sub)}</p>` : ''}
        </div>`;

    /* ---------- navbar / footer ---------- */
    function navItems() {
        const items = [{ label: 'Home', href: 'index.html', active: PAGE === 'hub' }];

        if (PAGE === 'hub') {
            items.push({ label: 'Libraries', href: 'index.html#libraries' });
        } else if (lib && lib.status === 'live') {
            const h = lib.home || {};
            items.push({ label: 'Overview', href: libHref(lib), active: PAGE === 'library' });
            if (PAGE === 'library') {
                if (h.features) items.push({ label: 'Features', href: libHref(lib, '#features') });
                if (h.pipeline) items.push({ label: 'Pipeline', href: libHref(lib, '#pipeline') });
                if (h.algorithms) items.push({ label: 'Algorithms', href: libHref(lib, '#algorithms') });
                if (h.quickstart) items.push({ label: 'Quickstart', href: libHref(lib, '#quickstart') });
            }
        }
        const docsLib = (PAGE === 'hub') ? defaultLib : lib;
        if (docsLib && docsLib.status === 'live' && docsLib.docs) {
            items.push({ label: 'Docs', href: docsHref(docsLib), active: PAGE === 'docs' });
        }
        return items;
    }

    function renderNavbar() {
        const s = D.site;
        const links = navItems().map((n) =>
            `<li><a href="${esc(n.href)}"${n.active ? ' class="active"' : ''}>${esc(n.label)}</a></li>`).join('');

        const github = s.links && s.links.github
            ? `<a href="${esc(s.links.github)}" target="_blank" rel="noopener" class="icon-btn" title="GitHub"><i class="fa-brands fa-github"></i></a>` : '';
        const portfolio = s.links && s.links.portfolio
            ? `<a href="${esc(s.links.portfolio)}" target="_blank" rel="noopener" class="icon-btn" title="Portfolio"><i class="fa-solid fa-globe"></i></a>` : '';

        const chip = (PAGE !== 'hub' && lib && lib.status === 'live')
            ? `<a class="version" href="${esc(libHref(lib))}" title="${esc(lib.name)} home">${esc(lib.name)} ${esc(lib.version || '')}</a>` : '';

        mount('navbarRoot', `
            <div class="navbar">
                <div class="logo">
                    <a href="index.html" style="text-decoration: none; color: inherit;">
                        <i class="${esc(s.logoIcon)}"></i> ${brandHtml()}
                    </a>
                    ${chip}
                </div>
                <ul class="nav-links">${links}</ul>
                <div class="nav-actions">${github}${portfolio}</div>
            </div>`);
    }

    function renderFooter() { mount('siteFooter', `<p>${esc(D.site.footer)}</p>`); }

    /* ======================================================================
       HUB  (index.html)
       ====================================================================== */
    function orbitScene() {
        const rings = [
            { ry: 0,   color: 'var(--accent)',   inset: 3,  dur: 9 },
            { ry: 45,  color: 'var(--accent-2)', inset: 11, dur: 12 },
            { ry: 90,  color: 'var(--accent-3)', inset: 19, dur: 15 },
            { ry: 135, color: '#f472b6',         inset: 27, dur: 18 }
        ];
        return `
        <div class="orbit-wrap" aria-hidden="true">
            <div class="orbit-core"><i class="${esc(D.site.logoIcon)}"></i></div>
            <div class="orbit-scene">
                <div class="orbit-spin">
                    ${rings.map((r) => `
                    <div class="orbit-ring" style="--ry:${r.ry}deg;--ring:${r.color};--inset:${r.inset}%;--dur:${r.dur}s">
                        <div class="orbit"><i class="node"></i></div>
                    </div>`).join('')}
                </div>
            </div>
        </div>`;
    }

    function libraryCard(l, i) {
        const live = l.status === 'live';
        const tags = (l.tags || []).map((t) => `<span class="tag-pill">${esc(t)}</span>`).join('');
        const action = live
            ? `<a class="btn btn-primary lift" href="${esc(libHref(l))}">Explore ${esc(l.name)} <i class="fa-solid fa-arrow-right"></i></a>`
            : `<button type="button" class="btn btn-soon lift" data-soon="${esc(soonMsg(l))}"><i class="fa-solid fa-hourglass-half"></i> Coming Soon</button>`;

        return `
        <div class="reveal" style="--d:${i * 140}ms">
            <article class="lib-card tilt${live ? '' : ' soon'}" data-tilt="7">
                <div class="glow-layer"></div>
                <div class="mb-6 flex items-start justify-between gap-4">
                    <div class="lib-icon lift-lg float-slow"><i class="${esc(l.icon)}"></i></div>
                    <span class="status ${live ? 'live' : 'soon'} lift"><i class="dot"></i>${live ? 'Live' : 'Coming Soon'}</span>
                </div>
                <h3 class="lift mb-1 text-2xl font-extrabold">${esc(l.name)}${live && l.version ? ` <span class="version align-middle">${esc(l.version)}</span>` : ''}</h3>
                <p class="lift mb-3 text-sm font-semibold text-[color:var(--accent)]">${esc(l.category || '')}</p>
                <p class="lift mb-5 text-[color:var(--text-muted)]">${esc(l.description || l.tagline || '')}</p>
                <div class="lift mb-2 flex flex-wrap gap-2">${tags}</div>
                ${action}
            </article>
        </div>`;
    }

    function renderHub() {
        const h = D.hub;
        document.title = h.pageTitle;
        const nLive = liveLibs.length, nSoon = libs.length - liveLibs.length;
        const words = esc(JSON.stringify(h.hero.words || []));

        mount('hubHero', `
            ${aurora}
            <div class="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-[8%] pb-12 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
                <div class="text-center lg:text-left">
                    <div class="badge pulse-badge reveal">${esc(h.hero.badge)}</div>
                    <h1 class="hub-title reveal text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl" style="--d:80ms">${brandHtml()}</h1>
                    <p class="reveal mt-5 text-xl font-semibold sm:text-2xl" style="--d:160ms">
                        ${esc(h.hero.kicker || '')} <span class="rot-word text-[color:var(--accent)]" data-words="${words}"></span><span class="caret"></span>
                    </p>
                    <p class="reveal mx-auto mt-4 max-w-xl text-lg text-[color:var(--text-muted)] lg:mx-0" style="--d:240ms">${esc(h.hero.subtitle)}</p>
                    <div class="reveal mt-8 flex flex-wrap justify-center gap-3 lg:justify-start" style="--d:320ms">
                        <a class="btn btn-primary" href="#libraries">${esc(h.hero.primaryCta)} <i class="fa-solid fa-arrow-down"></i></a>
                        ${defaultLib && defaultLib.docs ? `<a class="btn btn-ghost" href="${esc(docsHref(defaultLib))}"><i class="fa-solid fa-book-open"></i> ${esc(h.hero.secondaryCta)}</a>` : ''}
                    </div>
                    <div class="reveal mt-10 flex flex-wrap justify-center gap-4 lg:justify-start" style="--d:400ms">
                        <div class="stat"><b data-count="${nLive}">0</b><span>Libraries live</span></div>
                        <div class="stat"><b data-count="${nSoon}">0</b><span>Coming soon</span></div>
                        <div class="stat"><b>MIT</b><span>Licensed</span></div>
                    </div>
                </div>
                <div class="reveal" style="--d:200ms">${orbitScene()}</div>
            </div>
            <svg class="flow-line mx-auto block w-full max-w-6xl px-[4%]" viewBox="0 0 1200 60" preserveAspectRatio="none" aria-hidden="true">
                <defs><linearGradient id="flowGrad" x1="0" x2="1">
                    <stop offset="0" stop-color="var(--accent)" stop-opacity="0"/>
                    <stop offset=".5" stop-color="var(--accent)"/>
                    <stop offset="1" stop-color="var(--accent-2)" stop-opacity="0"/>
                </linearGradient></defs>
                <path d="M0 30 C 150 0, 300 60, 450 30 S 750 0, 900 30 S 1100 60, 1200 30" fill="none" stroke="url(#flowGrad)" stroke-width="2"/>
            </svg>`);

        mount('libraries', `
            <div class="mx-auto max-w-6xl px-[8%] py-20">
                ${sectionHead(h.libraries.title, h.libraries.subtitle)}
                <div class="mx-auto grid max-w-5xl grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-8">
                    ${libs.map(libraryCard).join('')}
                </div>
            </div>`);
    }

    /* ======================================================================
       LIBRARY HOME  (library.html?lib=...)
       ====================================================================== */
    function notice(title, text) {
        return `
            ${aurora}
            <div class="relative mx-auto max-w-2xl px-[8%] py-28 text-center">
                <div class="lib-icon float-slow mx-auto mb-6"><i class="fa-solid fa-hourglass-half"></i></div>
                <h1 class="mb-3 text-4xl font-extrabold">${esc(title)}</h1>
                <p class="mb-8 text-[color:var(--text-muted)]">${esc(text)}</p>
                <a class="btn btn-primary" href="index.html#libraries"><i class="fa-solid fa-arrow-left"></i> Back to all libraries</a>
            </div>`;
    }

    function vizPanel(kind) { return `<div class="viz-panel" data-visual="${esc(kind)}"></div>`; }

    function renderLibrary() {
        if (!lib) { mount('libHero', notice('Library not found', 'No libraries are defined in data.js yet.')); return; }
        if (lib.status !== 'live') {
            document.title = `${lib.name} - Coming Soon | ${D.site.name}`;
            mount('libHero', notice(`${lib.name} is coming soon`, lib.description || 'Stay tuned!'));
            return;
        }
        const h = lib.home;
        if (!h) { mount('libHero', notice(`${lib.name}`, 'This library is live but its `home` content is not added in data.js yet.')); return; }

        document.title = h.pageTitle || `${lib.name} | ${D.site.name}`;

        /* hero */
        mount('libHero', `
            ${aurora}
            <div class="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-[8%] pb-12 pt-12 lg:grid-cols-2 lg:pt-16">
                <div class="text-center lg:text-left">
                    <div class="badge pulse-badge reveal"><i class="${esc(lib.icon)}"></i> ${esc(lib.name)} &nbsp;•&nbsp; by ${esc(D.site.name)}</div>
                    <h1 class="gradient-text reveal mb-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl" style="--d:80ms">${esc(h.hero.title)}</h1>
                    <p class="reveal mx-auto mb-8 max-w-xl text-lg text-[color:var(--text-muted)] lg:mx-0" style="--d:160ms">${esc(h.hero.subtitle)}</p>
                    <div class="reveal" style="--d:240ms">${installBox(lib.install)}</div>
                    <div class="reveal mt-8 flex flex-wrap justify-center gap-3 lg:justify-start" style="--d:320ms">
                        ${lib.docs ? `<a class="btn btn-primary" href="${esc(docsHref(lib))}"><i class="fa-solid fa-book-open"></i> Read the Docs</a>` : ''}
                        <a class="btn btn-ghost" href="${h.algorithms ? '#algorithms' : '#features'}"><i class="fa-solid fa-play"></i> See it in action</a>
                    </div>
                </div>
                <div class="reveal" style="--d:200ms">${h.visual ? vizPanel(h.visual) : orbitScene()}</div>
            </div>`);

        /* features */
        if (h.features) {
            mount('features', `
                <div class="mx-auto max-w-6xl">
                    <h2 class="reveal">${esc(h.features.title)}</h2>
                    <div class="feature-grid">
                        ${h.features.items.map((f, i) => `
                        <div class="reveal" style="--d:${i * 120}ms">
                            <article class="feature-card tilt h-full" data-tilt="9">
                                <div class="glow-layer"></div>
                                <div class="icon-box lift-lg float-slow" style="animation-delay:${i * -1.1}s"><i class="${esc(f.icon)}"></i></div>
                                <h3 class="lift mb-2 text-xl font-bold">${esc(f.title)}</h3>
                                <p class="lift text-[color:var(--text-muted)]">${esc(f.text)}</p>
                            </article>
                        </div>`).join('')}
                    </div>
                </div>`);
        } else { const el = $('features'); if (el) el.remove(); }

        /* pipeline */
        if (h.pipeline) {
            mount('pipeline', `
                <div class="mx-auto max-w-6xl px-[8%] py-20">
                    ${sectionHead(h.pipeline.title, h.pipeline.subtitle)}
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        ${h.pipeline.steps.map((s, i) => `
                        <div class="pipe-step reveal" style="--d:${i * 130}ms">
                            <article class="pipe-card tilt h-full" data-tilt="10">
                                <div class="glow-layer"></div>
                                <span class="pipe-num">0${i + 1}</span>
                                <div class="icon-box lift-lg"><i class="${esc(s.icon)}"></i></div>
                                <h3 class="lift text-lg font-bold">${esc(s.title)}</h3>
                                <p class="lift">${esc(s.text)}</p>
                                ${s.code ? `<code class="pipe-code lift">${esc(s.code)}</code>` : ''}
                            </article>
                        </div>`).join('')}
                    </div>
                </div>`);
        } else { const el = $('pipeline'); if (el) el.remove(); }

        /* algorithms : zigzag rows (visual LEFT, then RIGHT, then LEFT ...) */
        if (h.algorithms) {
            const A = h.algorithms;
            mount('algorithms', `
                <div class="mx-auto max-w-6xl px-[8%] py-20">
                    ${sectionHead(A.title, A.subtitle)}
                    <div class="flex flex-col gap-20 lg:gap-28">
                        ${A.items.map((it, i) => {
                            const left = i % 2 === 0;            // true => visual left, text right
                            return `
                        <div class="algo-row grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-16">
                            <div class="reveal ${left ? 'reveal-left' : 'reveal-right lg:order-2'}">${vizPanel(it.visual)}</div>
                            <div class="reveal ${left ? 'reveal-right' : 'reveal-left lg:order-1'} text-center lg:text-left" style="--d:140ms">
                                <div class="mb-4 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                                    <span class="algo-num">${String(i + 1).padStart(2, '0')}</span>
                                    <span class="doc-badge" style="margin:0">${esc(it.tag || '')}</span>
                                </div>
                                <h3 class="mb-3 text-2xl font-extrabold tracking-tight sm:text-3xl">${esc(it.title)}</h3>
                                <p class="mb-5 text-[color:var(--text-muted)]">${esc(it.text)}</p>
                                ${(it.steps && it.steps.length) ? `<ol class="algo-steps">${it.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
                                <p class="algo-note">Illustrative 3D animation</p>
                            </div>
                        </div>`;
                        }).join('')}
                    </div>
                </div>`);
        } else { const el = $('algorithms'); if (el) el.remove(); }

        /* quickstart */
        if (h.quickstart) {
            mount('quickstart', `
                <h2 class="reveal">${esc(h.quickstart.title)}</h2>
                <p class="reveal">${esc(h.quickstart.description)}</p>
                <div class="reveal">${codeWindow(h.quickstart.filename, h.quickstart.source)}</div>`);
        } else { const el = $('quickstart'); if (el) el.remove(); }

        /* CTA */
        const cta = h.cta || { title: `Ready to build with ${lib.name}?`, text: 'Head over to the docs to get started.', button: 'Open the Docs' };
        if (lib.docs) {
            mount('docsCta', `
                <div class="mx-auto max-w-4xl px-[8%] pb-10 pt-6">
                    <div class="cta-band reveal text-center">
                        <h2 class="mb-3 text-3xl font-extrabold">${esc(cta.title)}</h2>
                        <p class="mx-auto mb-7 max-w-xl text-[color:var(--text-muted)]">${esc(cta.text)}</p>
                        <a class="btn btn-primary" href="${esc(docsHref(lib))}">${esc(cta.button)} <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>`);
        }
    }

    /* ======================================================================
       DOCS  (docs.html?lib=...)
       ====================================================================== */
    function renderSection(sec, isFirst) {
        const H = isFirst ? 'h1' : 'h2';
        let html = `<section id="${esc(sec.id)}">`;
        html += `<${H}>${esc(sec.title)}</${H}>`;
        if (sec.description) html += `<p>${inline(sec.description)}</p>`;
        (sec.paragraphs || []).forEach((p) => { html += `<p>${inline(p)}</p>`; });
        if (sec.command) html += installBox(sec.command);
        if (sec.badge) html += `<div class="doc-badge">${esc(sec.badge)}</div>`;

        if ((sec.params && sec.params.length) || sec.returns) {
            html += '<div class="spec-card">';
            if (sec.params && sec.params.length) {
                html += `<h4>Parameters / Inputs</h4>
                    <table class="spec-table">
                        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
                        <tbody>${sec.params.map((p) => `
                            <tr><td><code>${esc(p.name)}</code></td><td><code>${esc(p.type)}</code></td><td>${inline(p.description)}</td></tr>`).join('')}
                        </tbody>
                    </table>`;
            }
            if (sec.returns) {
                html += `<h4 style="margin-top: 1rem;">Returns</h4>
                    <p class="return-text"><code>${esc(sec.returns.type)}</code>: ${inline(sec.returns.description)}</p>`;
            }
            html += '</div>';
        }

        const codes = sec.code ? (Array.isArray(sec.code) ? sec.code : [sec.code]) : [];
        codes.forEach((c) => { html += codeWindow(c.filename, c.source); });
        return html + '</section>';
    }

    function librarySwitcher() {
        return `
            <div class="sidebar-group">
                <h3>Libraries</h3>
                <ul>${libs.map((l) => l.status === 'live'
                    ? `<li><a class="lib-switch${lib && l.id === lib.id ? ' current' : ''}" href="${esc(docsHref(l))}"><i class="${esc(l.icon)}"></i> ${esc(l.name)}</a></li>`
                    : `<li><a class="lib-switch soon" href="#" data-soon="${esc(soonMsg(l))}"><i class="${esc(l.icon)}"></i> ${esc(l.name)} <small>soon</small></a></li>`
                ).join('')}</ul>
            </div>`;
    }

    function renderDocs() {
        if (!lib) { mount('docsContent', '<h1>No libraries yet</h1>'); return; }
        if (lib.status !== 'live' || !lib.docs) {
            document.title = `${lib.name} Docs - Coming Soon | ${D.site.name}`;
            mount('docsSidebar', librarySwitcher());
            mount('docsContent', `
                <section class="py-10 text-center">
                    <div class="lib-icon float-slow mx-auto mb-6"><i class="fa-solid fa-hourglass-half"></i></div>
                    <h1>${esc(lib.name)} docs are coming soon</h1>
                    <p style="color: var(--text-muted)">${esc(lib.description || 'Stay tuned!')}</p>
                    <a class="btn btn-primary" style="margin-top:1.5rem" href="index.html#libraries"><i class="fa-solid fa-arrow-left"></i> Back to all libraries</a>
                </section>`);
            return;
        }

        const d = lib.docs;
        document.title = d.pageTitle || `${lib.name} Docs | ${D.site.name}`;
        const allSections = [];

        mount('docsSidebar', librarySwitcher() + d.groups.map((g) => `
            <div class="sidebar-group">
                <h3>${esc(g.title)}</h3>
                <ul>${g.sections.map((s) => {
                    allSections.push(s);
                    return `<li><a href="#${esc(s.id)}">${esc(s.label || s.title)}</a></li>`;
                }).join('')}</ul>
            </div>`).join(''));

        mount('docsContent', allSections.map((s, i) => renderSection(s, i === 0)).join('<hr class="doc-divider">'));
        setupScrollSpy();
    }

    // Sidebar mein current section apne aap highlight ho
    function setupScrollSpy() {
        const links = Array.from(document.querySelectorAll('.docs-sidebar a[href^="#"]'))
            .filter((a) => a.getAttribute('href').length > 1);
        const sections = links.map((a) => $(a.getAttribute('href').slice(1))).filter(Boolean);
        if (!sections.length) return;

        function update() {
            let current = sections[0];
            sections.forEach((s) => { if (s.getBoundingClientRect().top <= 140) current = s; });
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
                current = sections[sections.length - 1];
            }
            links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current.id));
        }
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    /* ---------- run ---------- */
    renderNavbar();
    renderFooter();
    if (PAGE === 'hub') renderHub();
    if (PAGE === 'library') renderLibrary();
    if (PAGE === 'docs') renderDocs();

    // Content JS se bana hai, isliye #hash wale link par manually scroll karna padta hai
    if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
})();
