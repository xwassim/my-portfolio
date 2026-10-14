/* V4 keeps the V3 architecture: bilingual content, color theme, project filters,
   project gallery and case-study modal — extended with narrative scroll scenes. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const store = (key, value) => {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {}
};
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let L = store('lang') === 'fr' ? 1 : 0;
let filter = 'all';
let revealObserver;
let wordTimer;
let rafPending = false;
let modalProjectId = null;
let modalMediaIndex = 0;
let lastFocus = null;
const cardSlides = new Map();
const featuredSlides = new Map();
let suppressClickUntil = 0;
let pointerFrame = 0;
let latestPointerEvent = null;

const T = {
  skip: ['Skip to content', 'Aller au contenu'],
  n1: ['Featured', 'Projets phares'],
  n2: ['All projects', 'Tous les projets'],
  n3: ['Method', 'Méthode'],
  n4: ['Applied AI', 'IA appliquée'],
  n5: ['Skills', 'Compétences'],
  n6: ['Let’s talk', 'Contact'],
  open: ['Open to opportunities · Algiers', 'Ouvert aux opportunités · Alger'],
  h1: ['I turn business needs into', 'Je transforme les besoins métier en'],
  words: ['useful systems|smooth workflows|digital products|clear interfaces', 'systèmes utiles|workflows fluides|produits digitaux|interfaces claires'],
  lede: [
    'Information systems engineer. I work where processes, people and technology meet: understanding the need, modelling the workflow, designing the interface and shipping it.',
    'Ingénieur en systèmes d’information. Je travaille là où processus, utilisateurs et technologie se rencontrent : comprendre le besoin, modéliser le workflow, concevoir l’interface et la livrer.'
  ],
  cta: ['Explore my work', 'Voir mes projets'],
  st1: ['Projects showcased', 'Projets présentés'],
  st2: ['Years of engineering studies', 'Années d’études d’ingénieur'],
  st3: ['Business · Product · Tech', 'Métier · Produit · Tech'],
  work_kicker: ['From systems thinking to tangible outcomes', 'De la pensée système aux résultats concrets'],
  selected_a: ['Selected', 'Projets'],
  selected_b: ['Work', 'Phares'],
  selected_note: ['Four projects. Four different ways to connect needs, information and people.', 'Quatre projets. Quatre façons de relier besoins, information et utilisateurs.'],
  featured_kicker: ['01 — Featured work', '01 — Projets phares'],
  featured_h: ['Systems with a story.', 'Des systèmes qui racontent une histoire.'],
  featured_p: ['A closer look at the reasoning, interfaces and functional choices behind selected work.', 'Un regard plus précis sur le raisonnement, les interfaces et les choix fonctionnels derrière une sélection de projets.'],
  projects_kicker: ['02 — Project index', '02 — Index des projets'],
  projects_h: ['All projects', 'Tous les projets'],
  projects_p: ['Enterprise systems, client work, mobile products and interface explorations. Open any card for the compact case study.', 'Systèmes d’entreprise, missions client, produits mobiles et explorations d’interface. Ouvrez une carte pour découvrir sa mini étude de cas.'],
  f_all: ['All', 'Tous'],
  f_systems: ['Information systems', 'Systèmes d’information'],
  f_product: ['Digital product', 'Produit digital'],
  f_web: ['Web', 'Web'],
  f_mobile: ['Mobile', 'Mobile'],
  f_desktop: ['Desktop & tools', 'Desktop & outils'],
  about_kicker: ['03 — How I work', '03 — Ma méthode'],
  ah: ['Understand. Model. <em>Make it useful.</em>', 'Comprendre. Modéliser. <em>Rendre utile.</em>'],
  ap1: ['My strongest projects start before the code: with the organisation, its users, its information and the decisions the system must support.', 'Mes meilleurs projets commencent avant le code : par l’organisation, ses utilisateurs, son information et les décisions que le système doit soutenir.'],
  ap2: ['Development is part of my toolkit, not my whole identity.', 'Le développement fait partie de ma boîte à outils, pas de toute mon identité.'],
  ai_kicker: ['04 — AI & intelligent systems', '04 — IA & systèmes intelligents'],
  ai_h: ['AI as a <em>functional component</em>.', 'L’IA comme <em>composant fonctionnel</em>.'],
  ai_p: [
    'I am particularly interested in integrating AI into information systems for search, document understanding, decision support and workflow assistance — not adding AI where there is no real business need.',
    'Je m’intéresse particulièrement à l’intégration de l’IA comme composant fonctionnel des systèmes d’information : recherche, compréhension documentaire, aide à la décision et assistance aux workflows, plutôt qu’à l’ajout d’IA sans besoin métier réel.'
  ],
  skills_kicker: ['05 — Capabilities', '05 — Compétences'],
  sh: ['A connected <em>toolkit</em>', 'Une boîte à outils <em>connectée</em>'],
  sp: ['Domains and tools I combine according to the problem — without artificial scores or percentages.', 'Des domaines et outils que je combine selon le problème — sans scores ni pourcentages artificiels.'],
  community_kicker: ['06 — Beyond the work', '06 — Au-delà des projets'],
  ch: ['People, teams and <em>community</em>', 'Humain, collectif et <em>communauté</em>'],
  cp: ['Volunteering, student life and sport: experiences that shape how I collaborate.', 'Bénévolat, vie étudiante et sport : des expériences qui façonnent ma manière de collaborer.'],
  education_kicker: ['07 — Background', '07 — Parcours'],
  eh: ['Education & <em>credentials</em>', 'Formation & <em>certifications</em>'],
  ep: ['The academic path behind the work, with room for verified credentials as they are added.', 'Le parcours académique derrière les projets, avec de la place pour les certifications vérifiées à venir.'],
  contact_kicker: ['08 — Start a conversation', '08 — Commençons'],
  contact_a: ['Let’s build', 'Une idée.'],
  contact_b: ['something', 'Un besoin.'],
  contact_c: ['useful.', 'Une solution.'],
  kp: ['Open to junior roles, internships and selected freelance missions in information systems and digital product.', 'Ouvert aux postes juniors, stages et missions freelance ciblées en systèmes d’information et produit digital.'],
  email: ['Email address to add', 'Adresse email à ajouter'],
  li: ['Profile URL to add', 'URL du profil à ajouter'],
  cv: ['Résumé link to add', 'Lien du CV à ajouter'],
  foot: ['Information systems · Processes · Digital products · Applied AI', 'Systèmes d’information · Processus · Produits digitaux · IA appliquée'],
  context: ['Context', 'Contexte'],
  challenge: ['Challenge', 'Défi'],
  solution: ['Solution', 'Solution'],
  role: ['My role', 'Mon rôle'],
  highlights: ['Highlights', 'Points clés'],
  technologies: ['Technologies & methods', 'Technologies & méthodes'],
  links: ['Links', 'Liens'],
  visit: ['Visit live site ↗', 'Voir le site ↗'],
  repo: ['View repository ↗', 'Voir le dépôt ↗'],
  no_public: ['No public link — case study only.', 'Pas de lien public — étude de cas uniquement.'],
  open_case: ['Open case study', 'Voir l’étude de cas'],
  close_case: ['Close case study', 'Fermer l’étude de cas'],
  previous: ['Previous media', 'Média précédent'],
  next: ['Next media', 'Média suivant'],
  slide: ['Show media', 'Afficher le média'],
  media_gallery: ['Featured project media', 'Médias du projet phare'],
  no_media: ['Visual documentation in progress', 'Documentation visuelle en cours'],
  details_pending: ['Project details are being documented.', 'Les détails du projet sont en cours de documentation.'],
  cert_h: ['Certifications', 'Certifications'],
  cert_p: ['Verified credentials will appear here with issuer, date and link.', 'Les certifications vérifiées apparaîtront ici avec organisme, date et lien.'],
  menu_open: ['Open navigation', 'Ouvrir la navigation'],
  menu_close: ['Close navigation', 'Fermer la navigation'],
  theme_dark: ['Use dark theme', 'Utiliser le thème sombre'],
  theme_light: ['Use light theme', 'Utiliser le thème clair']
};

const bi = (en, fr) => ({ en, fr });
const localeCode = () => (L ? 'fr' : 'en');
const x = value => {
  if (value && !Array.isArray(value) && typeof value === 'object' && 'en' in value) return value[localeCode()];
  return value;
};
const t = key => T[key][L];

const R1 = [
  bi('Business analysis', 'Analyse métier'),
  bi('Process design', 'Conception de processus'),
  bi('Information systems', 'Systèmes d’information'),
  bi('Enterprise applications', 'Applications métier'),
  bi('Digital products', 'Produits digitaux'),
  bi('Decision support', 'Aide à la décision'),
  bi('UI / UX', 'UI / UX'),
  bi('ERP & workflows', 'ERP & workflows')
];
const R2 = ['RAG', 'Odoo', 'Power BI', 'Oracle', 'PostgreSQL', 'React', 'Django', 'Spring Boot', 'TypeScript', 'Kotlin', 'Figma', 'Tauri', 'Git'];
const FACTS = [
  [bi('Based in', 'Basé à'), bi('Algiers, Algeria', 'Alger, Algérie')],
  [bi('Degree', 'Diplôme'), bi('State Engineer, ESI (SIT), 2026', 'Ingénieur d’État, ESI (SIT), 2026')],
  [bi('Focus', 'Domaines'), bi('IS · Processes · Product · AI', 'SI · Processus · Produit · IA')],
  [bi('Status', 'Statut'), bi('Open to opportunities', 'Ouvert aux opportunités')]
];
const STEPS = [
  {
    title: bi('Understand', 'Comprendre'),
    text: bi('Business needs, users, current situation, objectives and constraints.', 'Besoins métier, utilisateurs, existant, objectifs et contraintes.')
  },
  {
    title: bi('Model', 'Modéliser'),
    text: bi('Processes, workflows, data, actors, rules and interactions.', 'Processus, workflows, données, acteurs, règles et interactions.')
  },
  {
    title: bi('Design', 'Concevoir'),
    text: bi('Functional scope, architecture, user journeys, interfaces and dashboards.', 'Périmètre fonctionnel, architecture, parcours utilisateur, interfaces et tableaux de bord.')
  },
  {
    title: bi('Deliver', 'Livrer'),
    text: bi('Development, integration, testing, documentation, validation and iteration.', 'Développement, intégration, tests, documentation, validation et itérations.')
  }
];
const SKILLS = [
  { title: bi('Information Systems', 'Systèmes d’information'), items: ['Requirements', 'Functional analysis', 'UML', 'BPMN', 'Enterprise architecture'] },
  { title: bi('Process & Governance', 'Processus & gouvernance'), items: ['Process analysis', 'Workflows', 'IT audit', 'IT governance', 'ISO 9001', 'Documentation'] },
  { title: bi('ERP & Business Apps', 'ERP & applications métier'), items: ['Odoo', 'Business rules', 'Access control', 'Forms', 'Document lifecycle'] },
  { title: bi('Data & Decision Support', 'Données & aide à la décision'), items: ['SQL', 'Oracle', 'PostgreSQL', 'Power BI', 'KPIs', 'Reporting'] },
  { title: bi('Frontend & Product', 'Frontend & produit'), items: ['React', 'TypeScript', 'Kotlin', 'Jetpack Compose', 'Figma', 'UI / UX'] },
  { title: bi('Backend', 'Backend'), items: ['Django', 'Spring Boot', 'Python', 'PHP', 'REST APIs'] },
  { title: bi('Software Engineering', 'Génie logiciel'), items: ['Git & GitHub', 'Linux', 'Docker', 'Testing', 'Tauri', 'Rust'] }
];
const AI_DOMAINS = [
  { title: bi('Document intelligence', 'Intelligence documentaire'), text: 'RAG · OCR · Summarization' },
  { title: bi('Retrieval', 'Recherche'), text: 'Embeddings · Vector Search · Elasticsearch' },
  { title: bi('Assistants', 'Assistants'), text: 'Question answering · Source grounding' },
  { title: bi('Architecture', 'Architecture'), text: 'API · Local AI · Privacy considerations' }
];
const RAG_STEPS = [
  bi('Documents', 'Documents'),
  bi('Chunking', 'Découpage'),
  bi('Embeddings', 'Embeddings'),
  bi('Vector search', 'Recherche vectorielle'),
  bi('Context', 'Contexte'),
  bi('LLM / Answer', 'LLM / Réponse')
];
const COMMUNITY = [
  {
    kind: bi('Volunteering', 'Bénévolat'),
    title: 'SIDRA Association',
    text: bi('Community participation, field collaboration and collective action.', 'Participation associative, collaboration sur le terrain et action collective.'),
    color: '#ffb25b',
    image: 'assets/sidra1.jpg',
    alt: bi('SIDRA volunteers gathered on a sports field', 'Bénévoles de SIDRA réunis sur un terrain')
  },
  {
    kind: bi('Student life', 'Vie étudiante'),
    title: 'ESI clubs',
    text: bi('Scientific clubs, events and teamwork at ESI.', 'Clubs scientifiques, événements et travail d’équipe à l’ESI.'),
    color: '#6d7cff',
    image: 'assets/valoresi1.jpg',
    symbol: 'ESI'
  },
  {
    kind: bi('Sport', 'Sport'),
    title: bi('Team mindset', 'Esprit d’équipe'),
    text: bi('Football, basketball and swimming: discipline, rhythm and collective progress.', 'Football, basket et natation : discipline, rythme et progression collective.'),
    color: '#2fd5ff',
    image: 'assets/sec2.jpg',
    symbol: '↗'
  }
];
const EDUCATION = [
  {
    period: '2021 — 2026',
    title: bi('State Engineer in Computer Science', 'Ingénieur d’État en informatique'),
    text: bi('ESI Algiers · Information Systems & Technologies (SIT)', 'ESI Alger · Systèmes d’Information et Technologies (SIT)')
  },
  {
    period: '2020 — 2021',
    title: bi('Baccalaureate, Mathematics', 'Baccalauréat, Mathématiques'),
    text: bi('Algiers, Algeria', 'Alger, Algérie')
  }
];

const P = [
  {
    id: 'pgdi',
    title: 'PGDI — SETRAM',
    period: '2025–2026',
    type: bi('Enterprise system', 'Système d’entreprise'),
    status: bi('Private case study', 'Étude de cas privée'),
    categories: ['systems', 'web'],
    featured: true,
    featuredOrder: 1,
    accent: '#6977ff',
    media: [
      { src: 'assets/pgdi-login.png', alt: bi('PGDI intelligent document management login screen with workflow metrics', 'Écran de connexion PGDI avec métriques de workflows documentaires'), fit: 'contain', position: 'center', width: 1916, height: 906 }
    ],
    technologies: ['Information systems', 'Workflow design', 'RAG', 'Document lifecycle', 'Access control'],
    summary: bi('Document management, governed workflows and intelligent search in one enterprise platform.', 'Gestion documentaire, workflows gouvernés et recherche intelligente dans une même plateforme d’entreprise.'),
    context: bi('A quality-management environment spanning several units, processes and document responsibilities.', 'Un environnement de management de la qualité couvrant plusieurs unités, processus et responsabilités documentaires.'),
    challenge: bi('Make document creation, validation, publication and retrieval traceable without making the experience heavy.', 'Rendre traçables la création, la validation, la publication et la recherche documentaire sans alourdir l’expérience.'),
    role: bi('Requirements analysis, workflow and information-system design, implementation and delivery.', 'Analyse des besoins, conception des workflows et du SI, implémentation et livraison.'),
    solution: bi('A centralized platform combining document lifecycle controls, six workflow types and assisted retrieval through RAG.', 'Une plateforme centralisée combinant cycle de vie documentaire, six types de workflows et recherche assistée par RAG.'),
    highlights: [bi('6 workflow types', '6 types de workflows'), bi('8 units', '8 unités'), bi('15 processes', '15 processus'), bi('ISO 9001 context', 'Contexte ISO 9001')],
    featureStats: [{ value: '6', label: bi('Workflows', 'Workflows') }, { value: '8', label: bi('Units', 'Unités') }, { value: '15', label: bi('Processes', 'Processus') }, { value: 'RAG', label: bi('Grounded search', 'Recherche sourcée') }],
    sceneLine: bi('Need → governance → document lifecycle → retrieval', 'Besoin → gouvernance → cycle documentaire → recherche'),
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'noza',
    title: 'NOZA',
    period: '2026',
    type: bi('Client website', 'Site client'),
    status: bi('Live', 'En ligne'),
    categories: ['product', 'web'],
    featured: true,
    featuredOrder: 2,
    accent: '#f4ad27',
    media: [
      { src: 'assets/noza1.png', alt: bi('NOZA premium nuts website home page', 'Page d’accueil du site premium NOZA'), fit: 'cover', position: 'center', width: 1898, height: 915 }
    ],
    technologies: ['Web design', 'Responsive UI', 'Frontend integration', 'Deployment'],
    summary: bi('A warm, premium web presence translating a food brand into a clear digital experience.', 'Une présence web chaleureuse et premium qui traduit une marque alimentaire en expérience digitale claire.'),
    context: bi('A premium nuts brand needed a public-facing website consistent with its visual identity.', 'Une marque premium de fruits secs avait besoin d’un site public cohérent avec son identité visuelle.'),
    challenge: bi('Balance strong art direction, product discovery and responsive usability.', 'Équilibrer direction artistique, découverte des produits et usage responsive.'),
    role: bi('Design, front-end integration, deployment and client iterations.', 'Design, intégration front-end, déploiement et itérations avec le client.'),
    solution: bi('A visual storefront built around generous imagery, focused navigation and a restrained shopping journey.', 'Une vitrine visuelle fondée sur de grandes images, une navigation ciblée et un parcours commercial maîtrisé.'),
    highlights: [bi('Responsive brand experience', 'Expérience de marque responsive'), bi('Production delivery', 'Mise en production'), bi('Real client project', 'Projet client réel')],
    featureStats: [{ value: 'Brand', label: bi('Digital expression', 'Expression digitale') }, { value: 'UX', label: bi('Responsive journey', 'Parcours responsive') }, { value: 'Live', label: bi('Production delivery', 'Mise en ligne') }],
    sceneLine: bi('Identity → product discovery → conversion', 'Identité → découverte produit → conversion'),
    liveUrl: 'https://www.nozanuts.net/',
    repoUrl: null
  },
  {
    id: 'woms',
    title: 'WOMS',
    period: '—',
    type: bi('Operations & decision support', 'Opérations & aide à la décision'),
    status: bi('Case study', 'Étude de cas'),
    categories: ['systems', 'product', 'web'],
    featured: true,
    featuredOrder: 3,
    accent: '#4d67ff',
    media: [
      { src: 'assets/woms2.png', alt: bi('WOMS drilling-site operations list', 'Liste opérationnelle des sites de forage dans WOMS'), fit: 'contain', position: 'center', width: 742, height: 515 },
      { src: 'assets/woms1.png', alt: bi('WOMS cost and delay monitoring dashboard', 'Tableau de bord WOMS de suivi des coûts et délais'), fit: 'contain', position: 'center', width: 583, height: 417 }
    ],
    technologies: [],
    summary: bi('An operational flow that moves from drilling-site status to cost and schedule decisions.', 'Un parcours opérationnel qui passe du statut des sites de forage aux décisions sur les coûts et délais.'),
    context: bi('Operations teams need both a clear site list and a consolidated view of cost and schedule signals.', 'Les équipes opérationnelles ont besoin d’une liste claire des sites et d’une vue consolidée des signaux de coûts et délais.'),
    challenge: bi('Connect detailed operational follow-up with a decision-oriented dashboard.', 'Relier le suivi opérationnel détaillé à un tableau de bord orienté décision.'),
    role: null,
    solution: bi('Two complementary views: act on individual sites, then monitor global deviations and priorities.', 'Deux vues complémentaires : agir sur chaque site, puis suivre les écarts et priorités à l’échelle globale.'),
    highlights: [bi('Operations → monitor → decide', 'Opérations → suivre → décider'), bi('Cost and delay indicators', 'Indicateurs de coûts et délais'), bi('Drilling-site follow-up', 'Suivi des sites de forage')],
    featureStats: [{ value: '01', label: bi('Operations', 'Opérations') }, { value: '02', label: bi('Monitor', 'Suivre') }, { value: '03', label: bi('Decide', 'Décider') }],
    sceneLine: bi('Operations → monitor → decide', 'Opérations → suivre → décider'),
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'wakalati',
    title: 'Wakalati',
    period: '2024',
    type: bi('UI/UX · Customer portal', 'UI/UX · Portail client'),
    status: bi('Concept', 'Concept'),
    categories: ['systems', 'product', 'web'],
    featured: true,
    featuredOrder: 4,
    accent: '#3b8fe0',
    media: [
      { src: 'assets/wakalati1.png', alt: bi('Wakalati water-utility customer portal login', 'Connexion au portail client Wakalati'), fit: 'cover', position: 'center', width: 1370, height: 890 },
      { src: 'assets/wakalati2.png', alt: bi('Wakalati water distribution map', 'Carte du programme de distribution d’eau Wakalati'), fit: 'contain', position: 'center', width: 870, height: 780 }
    ],
    technologies: ['UI / UX', 'Customer portal', 'Service design', 'Data visualization'],
    summary: bi('A utility customer portal bringing service information, account access and distribution visibility together.', 'Un portail client qui réunit services, accès au compte et visibilité sur la distribution d’eau.'),
    context: bi('Water-service information is often fragmented across account, billing and operational touchpoints.', 'L’information liée au service de l’eau est souvent fragmentée entre compte, facturation et données opérationnelles.'),
    challenge: bi('Make utility information understandable and actionable for customers.', 'Rendre l’information du service compréhensible et exploitable par les clients.'),
    role: bi('Interface design and web implementation.', 'Conception de l’interface et implémentation web.'),
    solution: bi('A coherent portal joining authentication, customer services and a visual distribution programme.', 'Un portail cohérent reliant authentification, services client et programme visuel de distribution.'),
    highlights: [bi('Customer self-service', 'Libre-service client'), bi('Distribution map', 'Carte de distribution'), bi('Clear service journeys', 'Parcours de service clairs')],
    featureStats: [{ value: 'UX', label: bi('Customer access', 'Accès client') }, { value: 'Data', label: bi('Service visibility', 'Visibilité service') }, { value: 'Map', label: bi('Distribution clarity', 'Clarté de distribution') }],
    sceneLine: bi('Account → services → information → action', 'Compte → services → information → action'),
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'pch',
    title: 'PCH Purchase Orders',
    period: '2024',
    type: bi('Internship · Business app', 'Stage · Application métier'),
    status: bi('Case study', 'Étude de cas'),
    categories: ['systems', 'desktop'],
    featured: false,
    accent: '#2fd5ff',
    media: [
      { src: 'assets/pch.png', alt: bi('Configurable PCH purchase-order editor', 'Éditeur configurable de bons de commande PCH'), fit: 'contain', position: 'top', width: 648, height: 366 }
    ],
    technologies: ['Oracle', 'PHP', 'PDF automation', 'Dynamic forms'],
    summary: bi('A configurable tool generating standardized supplier purchase-order PDFs from Oracle data.', 'Un outil configurable qui génère des bons de commande fournisseurs PDF standardisés à partir de données Oracle.'),
    context: bi('Purchasing teams needed consistent documents while keeping supplier and profile variations manageable.', 'Les équipes achats avaient besoin de documents cohérents tout en gérant les variations de fournisseurs et de profils.'),
    challenge: bi('Turn dynamic purchasing data into controlled, reusable document layouts.', 'Transformer des données d’achat dynamiques en mises en page documentaires contrôlées et réutilisables.'),
    role: bi('Functional analysis with business and IT teams, dynamic forms, Oracle integration and configurable PDF layout.', 'Analyse fonctionnelle avec les équipes métier et IT, formulaires dynamiques, intégration Oracle et mise en page PDF configurable.'),
    solution: bi('A profile-driven editor connecting Oracle data to standardized PDF generation.', 'Un éditeur piloté par profils reliant les données Oracle à une génération PDF standardisée.'),
    highlights: [bi('Real operational need', 'Besoin opérationnel réel'), bi('Configurable document generation', 'Génération documentaire configurable'), bi('Business + IT collaboration', 'Collaboration métier + IT')],
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'fooddash',
    title: 'FooDash',
    period: '2024',
    type: bi('Academic mobile product', 'Produit mobile académique'),
    status: bi('Prototype', 'Prototype'),
    categories: ['product', 'mobile'],
    featured: false,
    accent: '#ff714d',
    media: [
      { src: 'assets/foodash2.png', alt: bi('FooDash restaurant discovery home screen', 'Écran d’accueil et découverte de restaurants FooDash'), fit: 'contain', position: 'top', width: 325, height: 673 },
      { src: 'assets/foodash1.png', alt: bi('FooDash mobile sign-in screen', 'Écran de connexion mobile FooDash'), fit: 'contain', position: 'top', width: 316, height: 677 }
    ],
    technologies: ['Kotlin', 'Jetpack Compose', 'Strapi', 'Mobile UX'],
    summary: bi('A food-delivery app covering discovery, menus, cart, orders, delivery and reviews.', 'Une app de livraison de repas couvrant découverte, menus, panier, commandes, livraison et avis.'),
    context: bi('An academic team project exploring a complete mobile ordering journey.', 'Un projet académique en équipe explorant un parcours mobile de commande complet.'),
    challenge: bi('Keep a feature-rich journey readable from discovery through delivery.', 'Garder lisible un parcours riche, de la découverte à la livraison.'),
    role: bi('Team contribution to the mobile experience.', 'Contribution d’équipe à l’expérience mobile.'),
    solution: bi('A Compose-based interface structured around familiar discovery and order patterns.', 'Une interface Compose structurée autour de repères familiers de découverte et de commande.'),
    highlights: [bi('End-to-end mobile journey', 'Parcours mobile de bout en bout'), bi('Restaurant discovery', 'Découverte de restaurants'), bi('Ordering flow', 'Parcours de commande')],
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'jawla',
    title: 'Jawla',
    period: '2024',
    type: bi('Figma · Mobile concept', 'Figma · Concept mobile'),
    status: bi('Prototype', 'Prototype'),
    categories: ['product', 'mobile'],
    featured: false,
    accent: '#82d9c1',
    media: [
      { src: 'assets/travel1.png', alt: bi('Jawla travel app welcome screen', 'Écran d’accueil de l’application de voyage Jawla'), fit: 'contain', position: 'top', width: 393, height: 851 },
      { src: 'assets/travel2.png', alt: bi('Jawla destination discovery and itinerary interface', 'Interface Jawla de découverte de destinations et itinéraires'), fit: 'contain', position: 'top', width: 393, height: 1906 }
    ],
    technologies: ['Figma', 'UI / UX', 'Mobile prototyping', 'Journey design'],
    summary: bi('A concept for exploring Algerian destinations through places, itineraries, maps and community content.', 'Un concept pour explorer les destinations algériennes à travers lieux, itinéraires, cartes et contenus communautaires.'),
    context: bi('Travel planning mixes inspiration, local knowledge and practical route decisions.', 'La préparation d’un voyage combine inspiration, connaissance locale et décisions d’itinéraire.'),
    challenge: bi('Unify discovery, community and itinerary creation in a coherent mobile journey.', 'Unifier découverte, communauté et création d’itinéraires dans un parcours mobile cohérent.'),
    role: bi('Interface concept, navigation flows, visual design and prototyping.', 'Concept d’interface, parcours de navigation, design visuel et prototypage.'),
    solution: bi('A layered experience combining editorial discovery, saved places, maps, forums and AI-assisted itinerary ideas.', 'Une expérience combinant découverte éditoriale, lieux enregistrés, cartes, forums et idées d’itinéraires assistées par IA.'),
    highlights: [bi('Destination discovery', 'Découverte de destinations'), bi('Maps & itineraries', 'Cartes & itinéraires'), bi('Editorial + community', 'Éditorial + communauté')],
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'retailhub',
    title: 'RetailHub — HYPERS & CO',
    period: '—',
    type: bi('Retail interface concept', 'Concept d’interface retail'),
    status: bi('Media mapping to confirm', 'Correspondance média à confirmer'),
    categories: ['product', 'web'],
    featured: false,
    accent: '#f04b4d',
    media: [
      { src: 'assets/hyperco1.png', alt: bi('HYPERS & CO streetwear storefront concept', 'Concept de vitrine streetwear HYPERS & CO'), fit: 'cover', position: 'center', width: 1396, height: 813 },
      { src: 'assets/hyperco2.png', alt: bi('HYPERS & CO retail product catalogue', 'Catalogue produit retail HYPERS & CO'), fit: 'cover', position: 'top', width: 1392, height: 891 }
    ],
    technologies: [],
    summary: bi('A retail interface exploration spanning brand landing and catalogue discovery.', 'Une exploration d’interface retail allant de la vitrine de marque à la découverte du catalogue.'),
    context: bi('The supplied media is branded HYPERS & CO; its mapping to the RetailHub project still needs confirmation.', 'Les médias fournis portent la marque HYPERS & CO ; leur correspondance avec le projet RetailHub reste à confirmer.'),
    challenge: bi('Give a bold retail identity enough structure to keep browsing direct.', 'Donner assez de structure à une identité retail forte pour garder une navigation directe.'),
    role: null,
    solution: bi('A high-contrast storefront paired with a clear, category-led catalogue.', 'Une vitrine très contrastée associée à un catalogue clair organisé par catégories.'),
    highlights: [bi('Brand-led storefront', 'Vitrine portée par la marque'), bi('Category browsing', 'Navigation par catégories'), bi('Two supplied views', 'Deux vues disponibles')],
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'almiyah',
    title: 'AlMiyah / Odoo',
    period: '—',
    type: bi('ERP · Business application', 'ERP · Application métier'),
    status: bi('Case study', 'Étude de cas'),
    categories: ['systems', 'web'],
    featured: false,
    accent: '#a05a84',
    media: [
      { src: 'assets/odoo1.png', alt: bi('AlMiyah Odoo customer request portal', 'Portail de réclamation client AlMiyah sous Odoo'), fit: 'contain', position: 'center', width: 894, height: 530 }
    ],
    technologies: ['Odoo'],
    summary: bi('A water-service customer portal concept built around Odoo and service requests.', 'Un concept de portail client pour un service des eaux, construit autour d’Odoo et des réclamations.'),
    context: bi('A business-application scenario connecting customer contact with water-service operations.', 'Un scénario d’application métier reliant contact client et opérations de service de l’eau.'),
    challenge: bi('Offer a clear entry point for customer requests inside an ERP-backed environment.', 'Offrir un point d’entrée clair pour les demandes client dans un environnement adossé à un ERP.'),
    role: null,
    solution: bi('A focused portal surface for starting and navigating service requests.', 'Une interface ciblée pour initier et parcourir les demandes de service.'),
    highlights: [bi('Odoo context', 'Contexte Odoo'), bi('Customer requests', 'Réclamations client'), bi('Business application', 'Application métier')],
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'sciquest',
    title: 'SciQuest',
    period: '—',
    type: bi('Project entry', 'Fiche projet'),
    status: bi('Documentation in progress', 'Documentation en cours'),
    categories: ['product', 'web'],
    featured: false,
    accent: '#43c6a2',
    media: [],
    technologies: [],
    summary: bi('Project entry preserved while its verified context and media are being prepared.', 'Fiche projet conservée pendant la préparation de son contexte vérifié et de ses médias.'),
    context: null,
    challenge: null,
    role: null,
    solution: null,
    highlights: [],
    liveUrl: null,
    repoUrl: null,
    detailsPending: true
  },
  {
    id: 'smartbookmark',
    title: 'SmartBookmark',
    period: '2026',
    type: bi('Personal desktop product', 'Produit desktop personnel'),
    status: bi('In progress', 'En cours'),
    categories: ['product', 'desktop'],
    featured: false,
    accent: '#9a72ff',
    media: [],
    technologies: ['Tauri', 'React', 'Local-first', 'Product design'],
    summary: bi('A local-first desktop product for organising web resources, in active development.', 'Un produit desktop local-first pour organiser ses ressources web, en développement actif.'),
    context: bi('Saved web resources become difficult to retrieve when they are scattered across browser tools.', 'Les ressources web enregistrées deviennent difficiles à retrouver lorsqu’elles sont dispersées dans les outils du navigateur.'),
    challenge: bi('Make capture and retrieval useful without depending on a remote service.', 'Rendre la capture et la recherche utiles sans dépendre d’un service distant.'),
    role: bi('Solo product design and development.', 'Conception produit et développement en solo.'),
    solution: bi('A local-first desktop workflow for collecting and organising resources.', 'Un parcours desktop local-first pour collecter et organiser les ressources.'),
    highlights: [bi('Local-first approach', 'Approche local-first'), bi('Product thinking', 'Réflexion produit'), bi('Iterative development', 'Développement itératif')],
    liveUrl: null,
    repoUrl: null
  },
  {
    id: 'treasury',
    title: 'Treasury Budget App',
    period: '—',
    type: bi('Project entry', 'Fiche projet'),
    status: bi('Documentation in progress', 'Documentation en cours'),
    categories: ['systems', 'desktop'],
    featured: false,
    accent: '#55b7e8',
    media: [],
    technologies: [],
    summary: bi('Project entry preserved while its verified functional scope and media are being prepared.', 'Fiche projet conservée pendant la préparation de son périmètre fonctionnel vérifié et de ses médias.'),
    context: null,
    challenge: null,
    role: null,
    solution: null,
    highlights: [],
    liveUrl: null,
    repoUrl: null,
    detailsPending: true
  }
];

const projectById = id => P.find(project => project.id === id);
const placeholder = project => `
  <div class="project-placeholder" role="img" aria-label="${t('no_media')}: ${project.title}">
    <span class="placeholder-grid" aria-hidden="true"></span>
    <b>${project.title.split(/[—/]/)[0].trim().slice(0, 2).toUpperCase()}</b>
    <small>${t('no_media')}</small>
  </div>`;
const imageMarkup = (media, eager = false) => `<img src="${media.src}" alt="${x(media.alt)}" width="${media.width}" height="${media.height}" loading="${eager ? 'eager' : 'lazy'}" decoding="async" style="--fit:${media.fit || 'cover'};--position:${media.position || 'center'}">`;

function renderStats() {
  const stats = [[P.length, 'st1'], [5, 'st2'], [3, 'st3']];
  $('#stats').innerHTML = stats.map(([value, label], index) => `
    <div><b data-count="${index < 2 ? value : ''}">${value}</b><span>${t(label)}</span></div>
  `).join('');
}

function renderFeatured() {
  const featured = P.filter(project => project.featured).sort((a, b) => a.featuredOrder - b.featuredOrder);
  $('#featured').innerHTML = featured.map((project, index) => {
    const activeSlide = featuredSlides.get(project.id) || 0;
    const hasCarousel = project.media.length > 1;
    const media = project.media.length ? `
      <div class="feature-track" style="--featured-slide:${activeSlide}">
        ${project.media.map((item, mediaIndex) => `
          <figure class="feature-media-layer${mediaIndex === activeSlide ? ' active' : ''}" aria-hidden="${mediaIndex === activeSlide ? 'false' : 'true'}">
            ${imageMarkup(item, index === 0 && mediaIndex === 0)}
          </figure>`).join('')}
      </div>
      ${hasCarousel ? `
        <div class="feature-arrows">
          <button type="button" data-feature-step="-1" data-project="${project.id}" aria-label="${t('previous')}">‹</button>
          <button type="button" data-feature-step="1" data-project="${project.id}" aria-label="${t('next')}">›</button>
        </div>
        <div class="feature-dots" role="group" aria-label="${t('slide')}">
          ${project.media.map((_, mediaIndex) => `<button type="button" class="${mediaIndex === activeSlide ? 'on' : ''}" data-feature-dot="${mediaIndex}" data-project="${project.id}" aria-label="${t('slide')} ${mediaIndex + 1}" aria-current="${mediaIndex === activeSlide ? 'true' : 'false'}"></button>`).join('')}
        </div>
      ` : ''}
    ` : placeholder(project);
    const stats = (project.featureStats || []).map((stat, statIndex) => `
      <span class="feature-stat stat-${statIndex}" role="listitem"><b>${stat.value}</b><small>${x(stat.label)}</small></span>
    `).join('');
    const sceneTags = project.technologies.length ? project.technologies.slice(0, 4) : project.highlights.slice(0, 3).map(x);
    return `
      <article class="feature-scene feature-${project.id}" data-feature="${project.id}" style="--accent:${project.accent};--scene-p:0">
        <div class="feature-pin">
          <div class="feature-copy">
            <p class="scene-index">${String(index + 1).padStart(2, '0')} / ${x(project.type)}</p>
            <h3>${project.title}</h3>
            <p class="scene-summary">${x(project.summary)}</p>
            <p class="scene-period">${project.period} · ${x(project.status)}</p>
            <div class="tags">${sceneTags.map(item => `<span>${item}</span>`).join('')}</div>
            <button class="text-link" type="button" data-open="${project.id}">${t('open_case')} <span aria-hidden="true">↗</span></button>
          </div>
          <div class="feature-visual">
            <div class="feature-glow" aria-hidden="true"></div>
            <div class="feature-media${hasCarousel ? ' has-carousel' : ''}"${hasCarousel ? ` data-feature-carousel="${project.id}" role="region" aria-roledescription="carousel" aria-label="${project.title} · ${t('media_gallery')}" tabindex="0"` : ''}>${media}</div>
            <div class="feature-stats" role="list" aria-label="${t('highlights')}">${stats}</div>
            <p class="scene-line">${x(project.sceneLine)}</p>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderFilters() {
  const filters = ['all', 'systems', 'product', 'web', 'mobile', 'desktop'];
  $('#flt').innerHTML = filters.map(key => `
    <button type="button" class="${key === filter ? 'on' : ''}" data-filter="${key}" aria-pressed="${key === filter}">${t('f_' + key)}</button>
  `).join('');
}

function cardMedia(project) {
  if (!project.media.length) return `<div class="card-media is-placeholder">${placeholder(project)}</div>`;
  const slide = cardSlides.get(project.id) || 0;
  return `
    <div class="card-media" data-carousel="${project.id}" style="--slide:${slide};--accent:${project.accent}">
      <div class="card-track">
        ${project.media.map(media => `<figure>${imageMarkup(media)}</figure>`).join('')}
      </div>
      ${project.media.length > 1 ? `
        <div class="card-arrows">
          <button type="button" data-card-step="-1" data-project="${project.id}" aria-label="${t('previous')}">‹</button>
          <button type="button" data-card-step="1" data-project="${project.id}" aria-label="${t('next')}">›</button>
        </div>
        <div class="card-dots" role="group" aria-label="${t('slide')}">
          ${project.media.map((_, index) => `<button type="button" class="${index === slide ? 'on' : ''}" data-card-dot="${index}" data-project="${project.id}" aria-label="${t('slide')} ${index + 1}" aria-current="${index === slide ? 'true' : 'false'}"></button>`).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderGrid() {
  renderFilters();
  const visible = P.filter(project => filter === 'all' || project.categories.includes(filter));
  $('#grid').innerHTML = visible.map(project => `
    <article class="card rv" style="--accent:${project.accent}" data-project-card="${project.id}">
      ${cardMedia(project)}
      <div class="card-body">
        <div class="card-meta"><span>${x(project.type)}</span><span>${project.period}</span></div>
        <h3>${project.title}</h3>
        <p>${x(project.summary)}</p>
        <div class="tags">${project.technologies.slice(0, 4).map(item => `<span>${item}</span>`).join('')}</div>
        <button class="card-case" type="button" data-open="${project.id}">${t('open_case')} <span aria-hidden="true">↗</span></button>
      </div>
    </article>
  `).join('');
  initReveal();
}

function renderMethod() {
  $('#facts').innerHTML = FACTS.map(([label, value]) => `<div><small>${x(label)}</small><b>${x(value)}</b></div>`).join('');
  $('#steps').innerHTML = STEPS.map((step, index) => `
    <li class="rv ${index === 0 ? 'active' : ''}" data-method="${index}" aria-current="${index === 0 ? 'step' : 'false'}">
      <span class="step-number">0${index + 1}</span>
      <h3>${x(step.title)}</h3>
      <p>${x(step.text)}</p>
    </li>
  `).join('');
}

function renderAI() {
  $('#ai-domains').innerHTML = AI_DOMAINS.map(item => `
    <div><h3>${x(item.title)}</h3><p>${item.text}</p></div>
  `).join('');
  $('#rag-pipeline').innerHTML = RAG_STEPS.map((step, index) => `
    <div class="rag-step ${index === 0 ? 'active' : ''}" data-rag="${index}">
      <span>0${index + 1}</span><b>${x(step)}</b>
    </div>
    ${index < RAG_STEPS.length - 1 ? '<i class="rag-link" aria-hidden="true"></i>' : ''}
  `).join('');
}

function renderSkills() {
  $('#sk').innerHTML = SKILLS.map((group, index) => `
    <article class="skill-group rv" tabindex="0" style="--skill-index:${index}">
      <span class="skill-number">0${index + 1}</span>
      <h3>${x(group.title)}</h3>
      <div class="skill-cloud">${group.items.map(item => `<span>${item}</span>`).join('')}</div>
    </article>
  `).join('');
}

function renderCommunity() {
  $('#cm').innerHTML = COMMUNITY.map((item, index) => `
    <article class="community-card rv" style="--accent:${item.color}">
      <div class="community-media">
        ${item.image ? `<img src="${item.image}" alt="${x(item.alt)}" width="1440" height="960" loading="lazy" decoding="async">` : `<span aria-hidden="true">${item.symbol}</span>`}
      </div>
      <div class="community-copy"><small>${x(item.kind)}</small><h3>${x(item.title)}</h3><p>${x(item.text)}</p></div>
    </article>
  `).join('');
}

function renderEducation() {
  $('#tl').innerHTML = EDUCATION.map(item => `
    <div class="rv"><small>${item.period}</small><h3>${x(item.title)}</h3><p>${x(item.text)}</p></div>
  `).join('');
  $('#ct').innerHTML = `<h3>${t('cert_h')}</h3><p>${t('cert_p')}</p>`;
}

function setWordRotation() {
  const word = $('#word');
  const words = t('words').split('|');
  let index = 0;
  clearInterval(wordTimer);
  word.textContent = words[0];
  if (reducedMotion.matches) return;
  wordTimer = setInterval(() => {
    word.classList.add('out');
    setTimeout(() => {
      index = (index + 1) % words.length;
      word.textContent = words[index];
      word.classList.remove('out');
    }, 300);
  }, 2700);
}

function renderMarquees() {
  $('#r1').innerHTML = [...R1, ...R1].map(item => `<span>${x(item)}</span>`).join('');
  $('#r2').innerHTML = [...R2, ...R2, ...R2].map(item => `<span>${item}</span>`).join('');
}

function render() {
  document.documentElement.lang = localeCode();
  $('#lang').textContent = L ? 'EN' : 'FR';
  $('#lang').setAttribute('aria-label', L ? 'Switch to English' : 'Passer en français');
  $$('[data-i]').forEach(element => { element.innerHTML = t(element.dataset.i); });
  renderStats();
  renderFeatured();
  renderMarquees();
  renderGrid();
  renderMethod();
  renderAI();
  renderSkills();
  renderCommunity();
  renderEducation();
  setWordRotation();
  updateMenuLabel();
  const themeValue = document.body.dataset.theme || 'dark';
  $('#theme').setAttribute('aria-label', themeValue === 'dark' ? t('theme_light') : t('theme_dark'));
  initReveal();
  if (modalProjectId) renderModal();
  scheduleMotionUpdate();
}

function initReveal() {
  if (revealObserver) revealObserver.disconnect();
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    $$('.rv').forEach(element => element.classList.add('in'));
    return;
  }
  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  $$('.rv:not(.in)').forEach((element, index) => {
    element.style.setProperty('--delay', (index % 4) * 70 + 'ms');
    revealObserver.observe(element);
  });
}

function setCardSlide(projectId, nextIndex) {
  const project = projectById(projectId);
  if (!project || project.media.length < 2) return;
  const index = (nextIndex + project.media.length) % project.media.length;
  cardSlides.set(projectId, index);
  const carousel = `[data-carousel="${projectId}"]`;
  $$(carousel).forEach(element => {
    element.style.setProperty('--slide', index);
    $$('[data-card-dot]', element).forEach((dot, dotIndex) => {
      dot.classList.toggle('on', dotIndex === index);
      dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
    });
  });
}

function stepCard(projectId, delta) {
  const current = cardSlides.get(projectId) || 0;
  setCardSlide(projectId, current + delta);
}

function setFeaturedSlide(projectId, nextIndex) {
  const project = projectById(projectId);
  if (!project || project.media.length < 2) return;
  const index = (nextIndex + project.media.length) % project.media.length;
  featuredSlides.set(projectId, index);
  $$(`[data-feature-carousel="${projectId}"]`).forEach(carousel => {
    $('.feature-track', carousel).style.setProperty('--featured-slide', index);
    $$('.feature-media-layer', carousel).forEach((slide, slideIndex) => {
      slide.classList.toggle('active', slideIndex === index);
      slide.setAttribute('aria-hidden', slideIndex === index ? 'false' : 'true');
    });
    $$('[data-feature-dot]', carousel).forEach((dot, dotIndex) => {
      dot.classList.toggle('on', dotIndex === index);
      dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
    });
  });
}

function stepFeatured(projectId, delta) {
  const current = featuredSlides.get(projectId) || 0;
  setFeaturedSlide(projectId, current + delta);
}

function modalMedia(project) {
  if (!project.media.length) return placeholder(project);
  const media = project.media[modalMediaIndex];
  return `
    <figure class="modal-media">${imageMarkup(media, true)}</figure>
    ${project.media.length > 1 ? `
      <button class="modal-arrow previous" type="button" data-modal-step="-1" aria-label="${t('previous')}">‹</button>
      <button class="modal-arrow next" type="button" data-modal-step="1" aria-label="${t('next')}">›</button>
    ` : ''}
  `;
}

function infoBlock(label, value) {
  if (!value) return '';
  return `<section class="case-block"><h3>${label}</h3><p>${x(value)}</p></section>`;
}

function renderModal() {
  const project = projectById(modalProjectId);
  if (!project) return;
  $('#md').style.setProperty('--accent', project.accent);
  $('#mm').innerHTML = modalMedia(project);
  $('#th').innerHTML = project.media.length > 1 ? project.media.map((media, index) => `
    <button type="button" class="${index === modalMediaIndex ? 'on' : ''}" data-modal-dot="${index}" aria-label="${t('slide')} ${index + 1}" aria-current="${index === modalMediaIndex ? 'true' : 'false'}">
      <img src="${media.src}" alt="" width="${media.width}" height="${media.height}" loading="lazy">
    </button>
  `).join('') : '';
  const details = project.detailsPending ? `<p class="pending-note">${t('details_pending')}</p>` : '';
  const highlights = project.highlights.length ? `
    <section class="case-block case-highlights"><h3>${t('highlights')}</h3><ul>${project.highlights.map(item => `<li>${x(item)}</li>`).join('')}</ul></section>
  ` : '';
  const technologies = project.technologies.length ? `
    <section class="case-block"><h3>${t('technologies')}</h3><div class="tags">${project.technologies.map(item => `<span>${item}</span>`).join('')}</div></section>
  ` : '';
  const links = `
    <section class="case-block case-links"><h3>${t('links')}</h3><div>
      ${project.liveUrl ? `<a class="btn p" href="${project.liveUrl}" target="_blank" rel="noreferrer">${t('visit')}</a>` : ''}
      ${project.repoUrl ? `<a class="btn" href="${project.repoUrl}" target="_blank" rel="noreferrer">${t('repo')}</a>` : ''}
      ${!project.liveUrl && !project.repoUrl ? `<p>${t('no_public')}</p>` : ''}
    </div></section>
  `;
  $('#mi').innerHTML = `
    <p class="case-meta">${x(project.type)} · ${project.period} · ${x(project.status)}</p>
    <h2 id="modal-title">${project.title}</h2>
    <p class="case-summary">${x(project.summary)}</p>
    ${details}
    <div class="case-grid">
      ${infoBlock(t('context'), project.context)}
      ${infoBlock(t('challenge'), project.challenge)}
      ${infoBlock(t('solution'), project.solution)}
      ${infoBlock(t('role'), project.role)}
    </div>
    ${highlights}
    ${technologies}
    ${links}
  `;
  $('.x', $('#md')).setAttribute('aria-label', t('close_case'));
}

function openModal(projectId) {
  const project = projectById(projectId);
  if (!project) return;
  lastFocus = document.activeElement;
  modalProjectId = projectId;
  modalMediaIndex = 0;
  renderModal();
  $('#md').classList.add('open');
  $('#md').setAttribute('aria-hidden', 'false');
  $('#main').inert = true;
  $('#hd').inert = true;
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => $('.pn', $('#md')).focus());
}

function closeModal() {
  const modal = $('#md');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  $('#main').inert = false;
  $('#hd').inert = false;
  document.body.classList.remove('modal-open');
  modalProjectId = null;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
}

function stepModal(delta) {
  const project = projectById(modalProjectId);
  if (!project || project.media.length < 2) return;
  modalMediaIndex = (modalMediaIndex + delta + project.media.length) % project.media.length;
  renderModal();
}

function trapModalFocus(event) {
  if (event.key !== 'Tab') return;
  const focusable = $$('button, a[href], [tabindex]:not([tabindex="-1"])', $('#md')).filter(element => !element.disabled);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function updateMenuLabel() {
  const menu = $('#menu');
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-label', open ? t('menu_close') : t('menu_open'));
}

function setMenu(open) {
  $('#nav').classList.toggle('open', open);
  $('#menu').classList.toggle('open', open);
  $('#menu').setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('nav-open', open);
  updateMenuLabel();
}

function setTheme(value) {
  document.body.dataset.theme = value;
  store('theme', value);
  $('#theme').setAttribute('aria-pressed', String(value === 'light'));
  $('#theme').setAttribute('aria-label', value === 'dark' ? t('theme_light') : t('theme_dark'));
  $('meta[name="theme-color"]').setAttribute('content', value === 'dark' ? '#090c13' : '#f3f1eb');
}

function updateMethod() {
  const steps = $$('.steps li');
  if (!steps.length) return;
  const target = innerHeight * 0.48;
  let active = 0;
  let distance = Infinity;
  steps.forEach((step, index) => {
    const rect = step.getBoundingClientRect();
    const currentDistance = Math.abs(rect.top + rect.height / 2 - target);
    if (currentDistance < distance) {
      distance = currentDistance;
      active = index;
    }
  });
  steps.forEach((step, index) => {
    step.classList.toggle('active', index === active);
    step.classList.toggle('past', index < active);
    step.setAttribute('aria-current', index === active ? 'step' : 'false');
  });
  $('#method-progress').style.height = ((active + 1) / steps.length * 100) + '%';
}

function updateRag() {
  const wrap = $('.rag-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const progress = clamp((innerHeight * 0.72 - rect.top) / Math.max(rect.height, 1));
  const active = Math.min(RAG_STEPS.length - 1, Math.floor(progress * RAG_STEPS.length));
  $$('.rag-step').forEach((step, index) => {
    step.classList.toggle('active', index === active);
    step.classList.toggle('done', index < active);
  });
  wrap.style.setProperty('--rag-p', progress);
}

function updateMotion() {
  rafPending = false;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  $('#bar').style.width = (maxScroll > 0 ? scrollY / maxScroll * 100 : 0) + '%';
  $('#hd').classList.toggle('scrolled', scrollY > 24);
  $$('.feature-scene').forEach(scene => {
    const rect = scene.getBoundingClientRect();
    const progress = reducedMotion.matches ? 0.55 : clamp((innerHeight * 0.84 - rect.top) / Math.max(rect.height - innerHeight * 0.18, 1));
    scene.style.setProperty('--scene-p', progress);
    scene.style.setProperty('--scene-shift', ((1 - progress) * 18) + 'px');
    scene.style.setProperty('--scene-scale', .96 + progress * .04);
    scene.style.setProperty('--feature-rotate', ((1 - progress) * 1.5) + 'deg');
    scene.style.setProperty('--stat-opacity', clamp((progress - .12) * 1.7));
    scene.style.setProperty('--stat-y', ((1 - progress) * 12) + 'px');
  });
  updateMethod();
  updateRag();
}

function scheduleMotionUpdate() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(updateMotion);
}

document.addEventListener('click', event => {
  if (performance.now() < suppressClickUntil && event.target.closest('.card, .feature-media')) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const cardStep = event.target.closest('[data-card-step]');
  const cardDot = event.target.closest('[data-card-dot]');
  const featuredStep = event.target.closest('[data-feature-step]');
  const featuredDot = event.target.closest('[data-feature-dot]');
  const modalStep = event.target.closest('[data-modal-step]');
  const modalDot = event.target.closest('[data-modal-dot]');
  const filterButton = event.target.closest('[data-filter]');
  const openButton = event.target.closest('[data-open]');
  if (cardStep) {
    event.stopPropagation();
    stepCard(cardStep.dataset.project, Number(cardStep.dataset.cardStep));
  } else if (cardDot) {
    event.stopPropagation();
    setCardSlide(cardDot.dataset.project, Number(cardDot.dataset.cardDot));
  } else if (featuredStep) {
    stepFeatured(featuredStep.dataset.project, Number(featuredStep.dataset.featureStep));
  } else if (featuredDot) {
    setFeaturedSlide(featuredDot.dataset.project, Number(featuredDot.dataset.featureDot));
  } else if (modalStep) {
    stepModal(Number(modalStep.dataset.modalStep));
  } else if (modalDot) {
    modalMediaIndex = Number(modalDot.dataset.modalDot);
    renderModal();
  } else if (filterButton) {
    filter = filterButton.dataset.filter;
    renderGrid();
    $(`[data-filter="${filter}"]`)?.focus();
  } else if (event.target.closest('[data-x]')) {
    closeModal();
  } else if (openButton) {
    openModal(openButton.dataset.open);
  } else {
    const projectCard = event.target.closest('[data-project-card]');
    if (projectCard && !event.target.closest('button, a')) openModal(projectCard.dataset.projectCard);
  }
  if (event.target.closest('#nav a')) setMenu(false);
});

document.addEventListener('keydown', event => {
  if (modalProjectId) {
    if (event.key === 'Escape') closeModal();
    else if (event.key === 'ArrowRight') stepModal(1);
    else if (event.key === 'ArrowLeft') stepModal(-1);
    trapModalFocus(event);
    return;
  }
  const featuredCarousel = event.target.closest('[data-feature-carousel]');
  if (featuredCarousel && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    event.preventDefault();
    stepFeatured(featuredCarousel.dataset.featureCarousel, event.key === 'ArrowRight' ? 1 : -1);
    return;
  }
  if (event.key === 'Escape') setMenu(false);
});

let swipeStart = null;
document.addEventListener('pointerdown', event => {
  const carousel = event.target.closest('[data-carousel], [data-feature-carousel]');
  if (!carousel || event.target.closest('button')) return;
  swipeStart = {
    id: carousel.dataset.carousel || carousel.dataset.featureCarousel,
    type: carousel.dataset.featureCarousel ? 'featured' : 'card',
    x: event.clientX,
    y: event.clientY,
    pointerId: event.pointerId
  };
});
document.addEventListener('pointerup', event => {
  if (!swipeStart || swipeStart.pointerId !== event.pointerId) return;
  const dx = event.clientX - swipeStart.x;
  const dy = event.clientY - swipeStart.y;
  if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy)) {
    suppressClickUntil = performance.now() + 450;
    (swipeStart.type === 'featured' ? stepFeatured : stepCard)(swipeStart.id, dx < 0 ? 1 : -1);
  }
  swipeStart = null;
});
document.addEventListener('pointercancel', () => { swipeStart = null; });

$('#lang').addEventListener('click', () => {
  L = 1 - L;
  store('lang', localeCode());
  render();
});
$('#theme').addEventListener('click', () => setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
$('#menu').addEventListener('click', () => setMenu($('#menu').getAttribute('aria-expanded') !== 'true'));

function paintPointer() {
    pointerFrame = 0;
    const event = latestPointerEvent;
    if (!event || !finePointer.matches || reducedMotion.matches) return;
    const glow = $('#glow').style;
    glow.setProperty('--gx', event.clientX + 'px');
    glow.setProperty('--gy', event.clientY + 'px');
    const heroVisual = $('#hv');
    heroVisual.style.setProperty('--tilt-y', (((event.clientX / innerWidth) - .5) * 4) + 'deg');
    heroVisual.style.setProperty('--tilt-x', (((event.clientY / innerHeight) - .5) * -3) + 'deg');
    const card = event.target.closest('.card');
    if (card) {
      const rect = card.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--rotate-y', (px - 0.5) * 3 + 'deg');
      card.style.setProperty('--rotate-x', (0.5 - py) * 3 + 'deg');
      card.style.setProperty('--pointer-x', px * 100 + '%');
      card.style.setProperty('--pointer-y', py * 100 + '%');
    }
}
addEventListener('pointermove', event => {
  latestPointerEvent = event;
  if (!pointerFrame) pointerFrame = requestAnimationFrame(paintPointer);
}, { passive: true });
document.addEventListener('pointerout', event => {
    const card = event.target.closest('.card');
    if (card && !card.contains(event.relatedTarget)) {
      card.style.setProperty('--rotate-x', '0deg');
      card.style.setProperty('--rotate-y', '0deg');
    }
});

addEventListener('scroll', scheduleMotionUpdate, { passive: true });
addEventListener('resize', () => {
  if (innerWidth > 900) setMenu(false);
  scheduleMotionUpdate();
}, { passive: true });
reducedMotion.addEventListener?.('change', () => {
  document.body.classList.toggle('reduced-motion', reducedMotion.matches);
  setWordRotation();
  initReveal();
  scheduleMotionUpdate();
});

document.body.classList.toggle('reduced-motion', reducedMotion.matches);
setTheme(store('theme') || 'dark');
render();
