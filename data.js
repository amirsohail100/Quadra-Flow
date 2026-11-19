/* ==========================================================================
   QuadraFlow – SITE DATA
   --------------------------------------------------------------------------
   Poori website ka content yahin se aata hai. HTML ya CSS touch karne ki
   zaroorat nahi: yahan naya item add karo, UI apne aap ban jayegi.

   QUICK GUIDE
   - Naya feature card      -> home.features.items mein ek { icon, title, text } add karo
   - Naya nav link          -> nav array mein { label, href } add karo
   - Naya docs sidebar group-> docs.groups mein ek { title, sections: [...] } add karo
   - Naya docs page/section -> kisi group ke `sections` mein ek object add karo

   DOCS SECTION KE FIELDS (sab optional, sirf `id` + `title` zaroori hain)
     id          : anchor id (URL mein #id banega, unique rakho)
     title       : section ka heading
     label       : sidebar mein dikhne wala naam (na do to `title` hi use hoga)
     description : heading ke neeche ek line
     paragraphs  : ["text", "text"]   (`backticks` se inline code ban jata hai)
     command     : "pip install ..."  (copy button wala install box)
     badge       : chhota tag, jaise "Machine Learning & AI"
     params      : [{ name, type, description }]  -> Parameters table
     returns     : { type, description }          -> Returns line
     code        : { filename, source }  ya  [ {..}, {..} ] -> code window(s)

   CODE SNIPPET LIKHNE KE RULES
   - Code ko String.raw`...` ke andar likho (backslash safe rehte hain).
   - Code ke andar backtick ( ` ) ya ${ use mat karo.
   - Syntax highlight (keyword / string / comment) JS apne aap karta hai,
     <span> likhne ki zaroorat nahi.
   ========================================================================== */

const SITE_DATA = {

    /* ---------- Brand / global ---------- */
    site: {
        name: "QuadraFlow",
        logoIcon: "fa-solid fa-layer-group",
        badge: "OmniLearn v1.0.0",            // navbar ke logo ke saath chhota tag
        footer: "QuadraFlow • Released under the MIT License. Designed for Python Developers.",
        links: {
            github: "https://github.com",
            portfolio: "https://yourportfolio.com"
        }
    },

    /* ---------- Navbar links ---------- */
    nav: [
        { label: "Features",   href: "index.html#features" },
        { label: "Quickstart", href: "index.html#quickstart" },
        { label: "Docs",       href: "docs.html" }
    ],

    /* ---------- Library info (QuadraFlow ke andar ki Python library) ---------- */
    library: {
        name: "OmniLearn",
        install: "pip install omnilearn"
    },

    /* ---------- Home page (index.html) ---------- */
    home: {
        pageTitle: "QuadraFlow - OmniLearn: Fast & Intuitive Python Framework",

        hero: {
            badge: "🚀 Production Ready Python Framework",
            title: "Build Lightning Fast AI & Web Services",
            subtitle: "A modern, high-performance Python library designed for developer productivity and seamless scalability."
        },

        features: {
            title: "Why Choose OmniLearn?",
            items: [
                {
                    icon: "fa-solid fa-bolt",
                    title: "High Performance",
                    text: "Asynchronous core built with high-throughput architecture for fast execution."
                },
                {
                    icon: "fa-solid fa-brain",
                    title: "ML & AI Native",
                    text: "Out-of-the-box support for TensorFlow, Scikit-Learn, NumPy, and Pandas workloads."
                },
                {
                    icon: "fa-solid fa-plug",
                    title: "Easy Integration",
                    text: "Seamlessly host data pipelines, machine learning predictions, and REST APIs."
                }
                // ,{ icon: "fa-solid fa-shield", title: "Naya Feature", text: "Yahan likho..." }
            ]
        },

        quickstart: {
            title: "Quickstart Example",
            description: "Get up and running with data workflows in seconds.",
            filename: "quickstart.py",
            source: String.raw`
import omnilearn as ol
import numpy as np

# Initialize OmniLearn Session
app = ol.App()

@app.task
def process_data():
    data = np.random.rand(100, 100)
    return np.mean(data)

if __name__ == "__main__":
    app.run()
`
        }
    },

    /* ---------- Docs page (docs.html) ---------- */
    docs: {
        pageTitle: "QuadraFlow Docs - OmniLearn Documentation",

        groups: [
            {
                title: "Getting Started",
                sections: [
                    {
                        id: "installation",
                        title: "Installation",
                        paragraphs: ["OmniLearn requires Python 3.8+. Install via pip:"],
                        command: "pip install omnilearn"
                    },
                    {
                        id: "omnilearn-core",
                        title: "Core Overview",
                        paragraphs: [
                            "OmniLearn is the Python library from QuadraFlow for high-level machine learning processing, pipeline execution, and dynamic model initialization.",
                            "Start with the `OmniLearn Pipeline` section below to see how a model is configured, trained, and returned."
                        ]
                    }
                ]
            },
            {
                title: "Core Module",
                sections: [
                    {
                        id: "omnilearn-snippet",
                        label: "OmniLearn Pipeline",
                        title: "OmniLearn Core Pipeline",
                        description: "High-level machine learning processing, pipeline execution, and dynamic model initialization.",
                        badge: "Machine Learning & AI",
                        params: [
                            { name: "data",       type: "pd.DataFrame / np.ndarray", description: "Input dataset array or frame." },
                            { name: "target",     type: "str / np.ndarray",          description: "Target field or array for training predictions." },
                            { name: "auto_scale", type: "bool",                      description: "Applies internal feature scaling when set to True (Default: True)." }
                        ],
                        returns: { type: "OmniModel", description: "Configured and optimized model instance." },
                        code: {
                            filename: "omnilearn_demo.py",
                            source: String.raw`
import omnilearn as ol

def run_pipeline(data, target, auto_scale=True):
    # Initialize OmniLearn model container
    model = ol.Model(auto_scale=auto_scale)

    # Fit data across workflow
    model.fit(data, target)
    return model

# Example Usage
model = run_pipeline(X, y)
print("OmniLearn Model Trained Successfully!")
`
                        }
                    }
                    // ,{ id: "naya-section", title: "Naya Section", paragraphs: ["..."] }
                ]
            }
            // ,{ title: "Naya Group", sections: [ ... ] }
        ]
    }
};
