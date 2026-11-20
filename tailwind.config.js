/* Tailwind CSS (Play CDN) config.
   preflight band hai taaki style.css ka base styling (theme variables, dark/light) na toote. */
tailwind.config = {
    corePlugins: { preflight: false },
    theme: {
        extend: {
            fontFamily: { mono: ['Fira Code', 'monospace'] }
        }
    }
};
