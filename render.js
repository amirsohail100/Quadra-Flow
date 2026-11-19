/* ==========================================================================
   QuadraFlow – RENDERER
   data.js ka content padh ke navbar, hero, features, quickstart, docs
   sidebar, docs sections aur footer HTML mein bana deta hai.
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

    const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    /* ---------- helpers ---------- */
    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    // Plain text + `inline code`
    const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

    const $ = (id) => document.getElementById(id);
    const mount = (id, html) => { const el = $(id); if (el) el.innerHTML = html; return el; };

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
                if (KEYWORDS.has(w)) {
                    out += `<span class="keyword">${w}</span>`;
                    expectName = (w === 'def' || w === 'class');
                } else if (expectName) {
                    out += `<span class="function">${w}</span>`;
                    expectName = false;
                } else {
                    out += esc(w);
                }
            }
        }
        out += esc(src.slice(last));
        return out;
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

    /* ---------- navbar (both pages) ---------- */
    function renderNavbar() {
        const s = D.site;
        const links = (D.nav || []).map((n) => {
            const [path, hash] = String(n.href).split('#');
            const isActive = !hash && path.toLowerCase() === currentPage;
            return `<li><a href="${esc(n.href)}"${isActive ? ' class="active"' : ''}>${esc(n.label)}</a></li>`;
        }).join('');

        const github = s.links && s.links.github
            ? `<a href="${esc(s.links.github)}" target="_blank" rel="noopener" class="icon-btn" title="GitHub"><i class="fa-brands fa-github"></i></a>` : '';
        const portfolio = s.links && s.links.portfolio
            ? `<a href="${esc(s.links.portfolio)}" target="_blank" rel="noopener" class="icon-btn" title="Portfolio"><i class="fa-solid fa-globe"></i></a>` : '';

        mount('navbarRoot', `
            <div class="navbar">
                <div class="logo">
                    <a href="index.html" style="text-decoration: none; color: inherit;">
                        <i class="${esc(s.logoIcon)}"></i> ${esc(s.name)}
                    </a>
                    ${s.badge ? `<span class="version">${esc(s.badge)}</span>` : ''}
                </div>
                <ul class="nav-links">${links}</ul>
                <div class="nav-actions">${github}${portfolio}</div>
            </div>`);
    }

    function renderFooter() {
        mount('siteFooter', `<p>${esc(D.site.footer)}</p>`);
    }

    /* ---------- home page ---------- */
    function renderHome() {
        const h = D.home;
        document.title = h.pageTitle;

        mount('heroRoot', `
            <div class="badge pulse-badge">${esc(h.hero.badge)}</div>
            <h1 class="gradient-text">${esc(h.hero.title)}</h1>
            <p>${esc(h.hero.subtitle)}</p>
            ${installBox(D.library.install)}`);

        mount('features', `
            <h2>${esc(h.features.title)}</h2>
            <div class="feature-grid">
                ${h.features.items.map((f) => `
                <div class="feature-card">
                    <div class="icon-box"><i class="${esc(f.icon)}"></i></div>
                    <h3>${esc(f.title)}</h3>
                    <p>${esc(f.text)}</p>
                </div>`).join('')}
            </div>`);

        mount('quickstart', `
            <h2>${esc(h.quickstart.title)}</h2>
            <p>${esc(h.quickstart.description)}</p>
            ${codeWindow(h.quickstart.filename, h.quickstart.source)}`);
    }

    /* ---------- docs page ---------- */
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

    function renderDocs() {
        const d = D.docs;
        document.title = d.pageTitle;
        const allSections = [];

        // Sidebar
        mount('docsSidebar', d.groups.map((g) => `
            <div class="sidebar-group">
                <h3>${esc(g.title)}</h3>
                <ul>${g.sections.map((s) => {
                    allSections.push(s);
                    return `<li><a href="#${esc(s.id)}">${esc(s.label || s.title)}</a></li>`;
                }).join('')}</ul>
            </div>`).join(''));

        // Content
        mount('docsContent', allSections
            .map((s, i) => renderSection(s, i === 0))
            .join('<hr class="doc-divider">'));

        setupScrollSpy();
    }

    // Sidebar mein current section apne aap highlight ho
    function setupScrollSpy() {
        const links = Array.from(document.querySelectorAll('.docs-sidebar a'));
        const sections = links
            .map((a) => $(a.getAttribute('href').slice(1)))
            .filter(Boolean);
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
    if ($('heroRoot')) renderHome();
    if ($('docsContent')) renderDocs();

    // Content JS se bana hai, isliye #hash wale link par manually scroll karna padta hai
    if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
})();
