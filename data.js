/* ==========================================================================
   QUADRA FLOW – SITE DATA
   --------------------------------------------------------------------------
   Poori website ka content yahin se aata hai. HTML / CSS touch karne ki
   zaroorat nahi: yahan naya item add karo, UI apne aap ban jayegi.

   SITE KA STRUCTURE
     index.html                 -> Quadra Flow HOME (saari libraries ke cards)
     library.html?lib=<id>      -> kisi ek library ka HOME page (3D animation wala)
     docs.html?lib=<id>         -> us library ke DOCS

   NAYI LIBRARY KAISE ADD KARNI HAI  (sabse zaroori)
   1. `libraries` array mein ek naya object add karo (neeche OmniLearn ka
      poora example hai, usse copy karke badal do).
   2. Jab tak library ready nahi hai: status: "coming-soon" rakho.
      Home par card ke andar "Coming Soon" button dikhega.
   3. Jab library ready ho: status: "live" kar do aur `version`, `install`,
      `home` aur `docs` bhar do. Bas! Card ka button apne aap
      "Explore <name>" ban jayega aur usse library.html / docs.html khulega.

   LIBRARY KE FIELDS
     id          : URL mein use hota hai (library.html?lib=omnilearn) – unique, chhota, no spaces
     status      : "live"  ya  "coming-soon"
     name, icon (Font Awesome class), category, tagline, description, tags[]
     version, install   (live ke liye)
     home        : { hero, visual, features, pipeline, algorithms, quickstart, cta }
                   (sab optional – jo likhoge wahi section dikhega)
                   visual   : "neuralnet" (hero ka 3D neural network)
                   algorithms : { title, subtitle, items:[{ visual, tag, title, text, steps[] }] }  (zigzag 3D section)
     docs        : { pageTitle, groups: [ { title, sections: [...] } ] }

   DOCS SECTION KE FIELDS (sab optional, sirf `id` + `title` zaroori hain)
     id, title, label (sidebar naam), description, paragraphs[], command,
     badge, params[{name,type,description}], returns{type,description},
     code {filename, source}  ya  [ {..}, {..} ]

   CODE SNIPPET LIKHNE KE RULES
   - Code ko String.raw`...` ke andar likho.
   - Code ke andar backtick ( ` ) ya ${ use mat karo.
   - Syntax highlight JS apne aap karta hai.
   ========================================================================== */

const SITE_DATA = {

    /* ---------- Brand / global ---------- */
    site: {
        name: "Quadra Flow",                       // pehla shabd white, baaki gradient mein dikhta hai
        logoIcon: "fa-solid fa-layer-group",
        footer: "Quadra Flow • Released under the MIT License. Designed for Python Developers.",
        links: {
            github: "https://github.com",
            portfolio: "https://yourportfolio.com"
        }
    },

    /* ---------- Quadra Flow HOME page (index.html) ---------- */
    hub: {
        pageTitle: "Quadra Flow - Python Libraries for AI & Web Services",

        hero: {
            badge: "🚀 Production Ready Python Libraries",
            kicker: "Python libraries for",
            words: ["AI & ML", "Data Pipelines", "Web Services", "REST APIs"],   // typing animation
            subtitle: "Quadra Flow is a growing family of modern, high-performance Python libraries designed for developer productivity and seamless scalability.",
            primaryCta: "Explore Libraries",
            secondaryCta: "Read the Docs"
        },

        libraries: {
            title: "Our Libraries",
            subtitle: "Pick a library to explore its home page and documentation."
        }
    },

    /* ---------- LIBRARIES ---------- */
    libraries: [

        /* ============================ 1) OmniLearn ============================ */
        {
            id: "omnilearn",
            status: "live",
            name: "OmniLearn",
            version: "v1.0.0",
            icon: "fa-solid fa-brain",
            category: "Machine Learning & AI",
            tagline: "Fast & intuitive machine learning pipelines",
            description: "A modern, high-performance Python library for machine learning pipelines, data processing and dynamic model initialization.",
            tags: ["Python", "ML & AI", "Pipelines"],
            install: "pip install omnilearn",

            /* ----- OmniLearn HOME page (library.html?lib=omnilearn) ----- */
            home: {
                pageTitle: "OmniLearn by Quadra Flow - Fast & Intuitive Python Framework",

                hero: {
                    badge: "🚀 Production Ready Python Framework",
                    title: "Build Lightning Fast AI & Web Services",
                    subtitle: "A modern, high-performance Python library designed for developer productivity and seamless scalability."
                },

                visual: "neuralnet",     // hero ke right side mein 3D neural network

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

                pipeline: {
                    title: "From raw data to a trained model",
                    subtitle: "The OmniLearn workflow in four steps.",
                    steps: [
                        { icon: "fa-solid fa-database",    title: "Bring your data",   text: "Pass a DataFrame or NumPy array as input, with a target field or array.",     code: "data, target = X, y" },
                        { icon: "fa-solid fa-sliders",     title: "Auto-scale",        text: "Internal feature scaling is applied for you when auto_scale is on.",         code: "ol.Model(auto_scale=True)" },
                        { icon: "fa-solid fa-diagram-project", title: "Fit the model", text: "One call trains the model across the whole workflow.",                       code: "model.fit(data, target)" },
                        { icon: "fa-solid fa-cube",        title: "Get an OmniModel",  text: "You get back a configured and optimized model instance, ready to use.",      code: "return model  # OmniModel" }
                    ]
                },

                /* ML algorithms 3D mein, zigzag: pehla visual LEFT, dusra RIGHT, phir LEFT, RIGHT...
                   Naya algorithm: items mein { visual, tag, title, text, steps } add karo.
                   visual = effects.js ke VISUALS ka naam:
                   kmeans | forest | pca | dbscan | knn | regression | neuralnet */
                algorithms: {
                    title: "ML algorithms in 3D",
                    subtitle: "Supervised, unsupervised and ensemble methods, visualised in motion.",
                    items: [
                        {
                            visual: "kmeans",
                            tag: "Unsupervised Learning",
                            title: "K-Means Clustering",
                            text: "Groups unlabelled data into k clusters by repeatedly assigning every point to its nearest centroid and moving each centroid to the middle of its group.",
                            steps: ["Pick k random centroids", "Assign every point to the nearest centroid", "Move centroids to the cluster mean, repeat until stable"]
                        },
                        {
                            visual: "forest",
                            tag: "Ensemble Learning",
                            title: "Random Forest",
                            text: "Many decision trees, each trained on a different random sample of the data, vote on the answer. The majority wins, which is usually more accurate and stable than any single tree.",
                            steps: ["Each tree sees a different random sample", "Every tree makes its own prediction", "The majority vote is the final prediction"]
                        },
                        {
                            visual: "pca",
                            tag: "Unsupervised \u00b7 Dimensionality Reduction",
                            title: "Principal Component Analysis (PCA)",
                            text: "Finds the directions along which the data varies the most and projects the data onto them, so 3D (or 300D) data can be explored in fewer dimensions while keeping most of the information.",
                            steps: ["Find the axes of maximum variance", "Rank them as principal components", "Project the data onto the top components"]
                        },
                        {
                            visual: "dbscan",
                            tag: "Unsupervised Learning",
                            title: "DBSCAN: Density-Based Clustering",
                            text: "Grows clusters outwards from dense regions and marks isolated points as noise. You do not choose the number of clusters, and clusters can take any shape.",
                            steps: ["Pick a radius (eps) and a minimum number of points", "Grow a cluster from every dense core point", "Points left over are marked as noise"]
                        },
                        {
                            visual: "knn",
                            tag: "Supervised Learning",
                            title: "K-Nearest Neighbors (KNN)",
                            text: "Classifies a new point by looking at its k closest labelled neighbours and taking a majority vote. There is no training step: the data itself is the model.",
                            steps: ["Measure the distance to every labelled point", "Take the k nearest neighbours", "The majority class wins the vote"]
                        },
                        {
                            visual: "regression",
                            tag: "Supervised Learning",
                            title: "Linear Regression",
                            text: "Fits a line (a plane in higher dimensions) through the data by gradient descent, step by step shrinking the squared error between predictions and real values.",
                            steps: ["Start with a random plane", "Measure the error to every point", "Nudge the plane downhill until the error stops shrinking"]
                        }
                        // ,{ visual: "knn", tag: "...", title: "...", text: "...", steps: ["...", "..."] }
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
                },

                cta: {
                    title: "Ready to build with OmniLearn?",
                    text: "Installation, the core pipeline and every parameter are covered in the docs.",
                    button: "Open the Docs"
                }
            },

            /* ----- OmniLearn DOCS page (docs.html?lib=omnilearn) ----- */
            docs: {
                pageTitle: "OmniLearn Docs - Quadra Flow",

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
                                    "OmniLearn is the Python library from Quadra Flow for high-level machine learning processing, pipeline execution, and dynamic model initialization.",
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
        },

        /* ====================== 2) Next library (abhi Coming Soon) ======================
           Jab ready ho: status ko "live" karo, name/icon/tagline badlo, aur
           version, install, home, docs bhar do (OmniLearn wale block jaisa).      */
        {
            id: "next-library",
            status: "coming-soon",
            name: "Next Library",
            icon: "fa-solid fa-hourglass-half",
            category: "New Library",
            tagline: "Something new is on the way",
            description: "Another Python library from Quadra Flow is in the works. Stay tuned for the launch.",
            tags: ["Python", "Coming Soon"]
        }
    ]
};
