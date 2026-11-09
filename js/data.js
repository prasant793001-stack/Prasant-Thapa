/* ============================================================
   PRASANT · STORY SITE — DATA
   Everything the site knows lives here. Edit freely.
   (Classic script on purpose: works from file:// and GitHub Pages.)
   ============================================================ */
window.PKT = {};

/* --- identity ------------------------------------------------ */
PKT.me = {
  name: 'Prasant Kumar Thapa',
  handle: 'tzprasantofficial',
  email: 'Tz.Prasant.Official@gmail.com',
  phone: '+971 54 430 3956',
  whatsapp: 'https://wa.me/971544303956',
  motto: 'Experience cannot be created. It can only be lived.',
  catCount: 17,            // <- change here if the number changes
};

/* Photos / cat pictures / thumbnails live on the live portfolio.
   If you copy that site's /photos folder next to this site, set BASE = 'photos/'  */
PKT.PHOTOS = 'https://tzprasantofficial-ai.github.io/-Prasant-/photos/';
PKT.VIDEOS = 'https://tzprasantofficial-ai.github.io/-Prasant-/videos/';

/* --- frame sequences (cut from the video) --------------------- */
PKT.seq = {
  hello:   { dir: 'assets/seq/hello',   t0: 0.0,   t1: 10.03 },
  storm:   { dir: 'assets/seq/storm',   t0: 10.03, t1: 14.3  },
  anchor:  { dir: 'assets/seq/anchor',  t0: 14.5,  t1: 19.63 },
  office:  { dir: 'assets/seq/office',  t0: 19.63, t1: 29.6  },
  desk:    { dir: 'assets/seq/desk',    t0: 29.6,  t1: 39.6  },
  cockpit: { dir: 'assets/seq/cockpit', t0: 39.6,  t1: 49.6  },
  home:    { dir: 'assets/seq/home',    t0: 53.4,  t1: 59.6  },
};

/* --- life timeline ------------------------------------------- */
PKT.roots = [
  { y: '1996', t: 'Born in Shillong',            d: 'Meghalaya, North-East India. The abode of clouds.' },
  { y: '2012', t: 'S.S.L.C.',                    d: "St. Anthony's Hr. Sec. School, Shillong." },
  { y: '2012', t: 'Desktop Publishing course',   d: 'Vinit Computers, Shillong. My first design software, the seed of everything visual.' },
  { y: '2013', t: 'Found flight simulation',     d: 'Hunted down X-Plane 10. Thirteen years later, still flying.' },
  { y: '2014', t: 'Built my own throttle',       d: 'A phone box, syringes, a potentiometer and an Arduino. I could not buy one, so I made one.' },
  { y: '2015', t: 'H.S.S.L.C.',                  d: "St. Peter's College, Shillong." },
];

PKT.flights = [
  { y: 'Apr 2015 – Oct 2016', role: 'Sales Executive',             co: 'Reliance Digital',        place: 'India',          code: 'IND', gate: 'A1', line: 'Matched people to the right gadget for their budget.' },
  { y: '2016',                role: 'Diploma, Airport Management', co: 'Maharashtra Aviation Academy', place: 'Mumbai',    code: 'BOM', gate: 'B4', line: 'Learned how an airport really breathes.' },
  { y: 'Jan 2017 – Feb 2018', role: 'Passenger Service Agent',     co: 'Celebi NAS · Bangkok Airways', place: 'Bangkok',   code: 'BKK', gate: 'C2', line: 'Check-in, boarding, lost bags, VIPs. A dream job.' },
  { y: 'May 2018 – Dec 2019', role: 'Call Centre Executive → Supervisor', co: 'Resolute Group',   place: 'Dubai',          code: 'DXB', gate: 'D7', line: 'Promoted in six months. Chowking, Jollibee, Asia Kitchen & more.' },
  { y: 'Feb 2020 – Aug 2021', role: 'Telesales Executive',         co: 'Jumbo · Du Telecom',      place: 'Dubai',          code: 'DXB', gate: 'D9', line: 'Built relationships entirely by phone.' },
  { y: 'Oct 2021 – now',      role: 'Retail Sales',                co: 'Etisalat (e&)',           place: 'Al Ain',         code: 'AAN', gate: 'E1', line: 'Turning telecom features into simple stories.' },
];

/* --- the two companies --------------------------------------- */
PKT.companies = {
  udesign: {
    name: 'U-Design', tag: 'U Design. We Print.',
    line: 'Custom printing from Al Ain. DTF and sublimation, same-day delivery.',
    story: "I could not find affordable custom clothing that was not terrible quality, so Umair and I bought the machines ourselves. Founded July 2026.",
    items: ['t-shirts', 'hoodies', 'mugs', 'keychains', 'bottles', 'pillows', 'phone covers', 'tote bags', 'caps'],
    sister: { name: 'COCO Pet Care', line: 'Named after my first cat. QR pet tags land on COCO pages.', sign: 'Follow us, join the pack — because every paw deserves its way back.' },
    url: 'https://udesign999-bot.github.io/',
  },
  aakriti: {
    name: 'Aakriti', deva: 'आकृति', tag: 'AI marketing for UAE businesses',
    line: 'Helping restaurants, boutiques, real estate and shops get more customers with AI. Taught openly, no gatekeeping, no jargon.',
    story: 'Aakriti means "form" in Sanskrit. Simple English and Hindi, always.',
    handle: '@aakriti.design',
    url: 'https://aakritimarketing.github.io/',
  },
  qr: { name: 'QR Connect', line: 'A QR on a keychain, magnet or pet pendant. The tag never changes, the page behind it can change a hundred times.' },
};

/* --- toolkit -------------------------------------------------- */
PKT.tools = ['Premiere Pro', 'After Effects', 'Canva', 'Motion graphics', 'Photography', 'Videography', 'DTF printing', 'Sublimation', 'Claude', 'ChatGPT', 'Gemini', 'ElevenLabs', 'Kling', 'Google Flow', 'ComfyUI', 'Arduino', 'Python', 'GitHub Pages', 'Firebase'];

/* --- the people ---------------------------------------------- */
PKT.people = [
  { who: 'Mom', name: 'Sabita Thapa', note: 'Back home. A giver, always. Pets were never "animals" in our house.' },
  { who: 'Sister', name: 'Sefali Thapa', note: 'Back home, with Mom, Rockey, Chenchin and a cat who is also called Lala.' },
  { who: 'Friend & co-founder', name: 'Umair Bhai', note: 'From Pakistan, I am from Meghalaya. Together: U-Design.' },
];
PKT.crew = ['Umair', 'Ryan', 'Ziko', 'Erwin', 'Benedict', 'Erick', 'Hamda', 'Akhil', 'Abdulla', 'Mark', 'Mohan'];
PKT.mentors = ['Ms. Mariam', 'Ms. Mona', 'Mr. Sulaiman', 'Mr. Ala', 'Mr. Anwar', 'Mr. Mulhan', 'Mr. Khurbi', 'Hassan', 'Mr. Fauzi', 'Ms. Amira', 'Mr. Falah', 'Mr. Salmi'];

/* The nine cat chapters (same photos as the live portfolio) */
PKT.cats = [
  { n: '01', name: 'Coco',                    img: 'cat-01-coco',                tag: 'The first one',      story: 'Found inside a neighbour\'s house, rescued as a kitten. Her spay surgery terrified me.' },
  { n: '02', name: 'Mommy & the Four Queens', img: 'cat-02-mommy',               tag: 'Rani · Princess · Angel · Queen', story: 'A pregnant stray I fed outside. I took her in during the rains. Her four daughters followed.' },
  { n: '03', name: 'The Second Litter',       img: 'cat-03-second-litter',       tag: 'Mommy came back',    story: 'Four more kittens, three girls and one boy. The boy could not be saved despite everything.' },
  { n: '04', name: 'Lala',                    img: 'cat-04-lala',                tag: 'Parking lot, injured', story: 'Abandoned, hurt, in my workplace parking lot.' },
  { n: '05', name: 'Dulli',                   img: 'cat-05-dulli',               tag: 'Same parking lot',   story: 'The same parking lot, months later.' },
  { n: '06', name: 'Raja',                    img: 'cat-06-raja',                tag: 'The window ledge',   story: 'He sat on my ledge behind one-way glass and could not see the AC or the food one pane away. I opened the window. He vanished for a week, then came home for good.' },
  { n: '07', name: 'The Fighter',             img: 'cat-07-fighter',             tag: 'Broken leg',         story: 'Found by my flower pot, lower body paralysed. Surgery meant a full month\'s salary with no guarantee. So: a house in my washroom, daily cleaning, walking practice. A year later she runs.' },
  { n: '08', name: 'Philippine & Kabahan',    img: 'cat-08-philippine-kabahan',  tag: 'Left outside',       story: 'Abandoned outside my building with their mother. Two siblings were lost before I took them in.' },
  { n: '09', name: 'The Last Rescue',         img: 'cat-09-last-rescue',         tag: 'Only survivor',      story: 'The only survivor of a lost mother cat\'s litter. Two months with me. Still searching for the mother.' },
];

/* the 20 frames (photo-01 … photo-20) */
PKT.photoCount = 20;
PKT.videoFiles = ['video-01.mp4', 'video-03.mp4', 'video-04.mp4'];

/* --- gaming -------------------------------------------------- */
PKT.sims = ['X-Plane 10', 'X-Plane 12', 'MSFS', 'MSFS 2020', 'MSFS 2024'];
PKT.playlist = ['Call of Duty', 'Microsoft Flight Simulator', 'Aeroplanes. Always aeroplanes', 'GTA', 'Marvel movies', 'One Piece'];
PKT.channels = [
  { name: 'TZ Gaming',      line: 'Gaming and flight sim.',                    img: 'yt-tz-gaming' },
  { name: 'Bakchod Reacts', line: 'Reaction videos with a colleague.',          img: 'yt-bakchod-reacts' },
];

/* ============================================================
   THE WORKSPACE — 23 creations (from the Site Index)
   started   = repo created
   completed = last push
   pal: sky / ground1 / ground2 / accent  (read off each site's own CSS)
   world: which 3D landscape grows from it
   ============================================================ */
PKT.creations = [
  // ---------- Aakriti Marketing ----------
  { id: 'pptx',   name: 'PPTX Studio',        group: 'Aakriti', cat: 'Business', logo: 'pptx',
    url: 'https://aakritimarketing.github.io/PPTX-STUDIO/', started: '2026-09-07', completed: '2026-09-07',
    one: 'Open, edit and build PowerPoint files right in the browser. Nothing is uploaded.',
    long: 'Drop a .pptx, edit any text, swap in images (QR codes, logos, screenshots) and flip through a slide viewer. Everything runs inside your browser.',
    world: 'slabs', pal: ['#EEF1F6', '#FFFFFF', '#C7D0DC', '#E8112D'], ink: '#16202E', font: 'System sans' },
  { id: 'balala', name: 'BalalaHop',          group: 'Aakriti', cat: 'Work', logo: 'balala',
    url: 'https://aakritimarketing.github.io/BalalaHop/', started: '2026-08-17', completed: '2026-08-22',
    one: 'Builds one clean, locked prompt for your next script, reel, video or photo.',
    long: 'Pick what you are making, then characters, backgrounds, lines and quotes. Out comes a single locked prompt.',
    world: 'blobs', pal: ['#1B1420', '#3A2E44', '#F5EFE6', '#FF9F6B'], ink: '#F5EFE6', font: 'Fredoka' },
  { id: 'gesture', name: 'Gesture · Inclusion Bridge', group: 'Aakriti', cat: 'Work', logo: 'gesture',
    url: 'https://aakritimarketing.github.io/-Gesture-try/', started: '2026-08-23', completed: '2026-09-09',
    one: 'Inclusion Bridge: a live, two-way gesture experiment.',
    long: 'Inclusion Bridge, live and two-way. A gesture-driven test build from the Aakriti lab.',
    world: 'bridge', pal: ['#0A0A0A', '#1A1A1A', '#00FFCC', '#FF5566'], ink: '#FFFFFF', font: 'System sans' },
  { id: 'pdf',    name: 'PDF Converter',      group: 'Aakriti', cat: 'Business', logo: 'pdf',
    url: 'https://aakritimarketing.github.io/-Converter-/', started: '2026-08-25', completed: '2026-08-26',
    one: 'A fast PDF and document studio that works on mobile and desktop.',
    long: 'The "Ultimate High-Performance PDF & Document Studio", also known as U-Converter NEXUS.',
    world: 'canyon', pal: ['#0F172A', '#1E293B', '#475569', '#94A3B8'], ink: '#F8FAFC', font: 'System sans' },
  { id: 'bgremove', name: 'Cutout Studio',    group: 'Aakriti', cat: 'Business', logo: 'bgremove',
    url: 'https://aakritimarketing.github.io/-BG-Remover-/', started: '2026-08-26', completed: '2026-08-26',
    one: 'Removes image backgrounds privately, right in your browser.',
    long: '"Make the subject stand out." Drop a photo, clean edges are found automatically, the image never leaves your device.',
    world: 'cutout', pal: ['#F6F8F2', '#C8EF63', '#14231F', '#F2765D'], ink: '#14231F', font: 'Space Grotesk · DM Mono' },
  { id: 'nfc',    name: 'NFC Bench',          group: 'Aakriti', cat: 'Business', logo: 'nfc',
    url: 'https://aakritimarketing.github.io/NFC-R-W-/', started: '2026-08-31', completed: '2026-08-31',
    one: 'A bench for reading, building and writing NFC tags.',
    long: 'Tag library, chip and capacity, records on the tag, add a record. Hit Save and the tag is yours.',
    world: 'circuit', pal: ['#14191C', '#232B30', '#C17B45', '#E0965B'], ink: '#EDEFF2', font: 'Space Grotesk · IBM Plex Mono' },
  { id: 'sas',    name: 'U-Scan Inventory',   group: 'Aakriti', cat: 'Business', logo: 'inventory',
    url: 'https://aakritimarketing.github.io/SAS-INVENTERY/', started: '2026-09-01', completed: '2026-09-01',
    one: 'Scan-based stock tracking for shops and stores.',
    long: 'An inventory app built around scanning. Dark, quick and made for the shop floor.',
    world: 'crates', pal: ['#14181D', '#242B34', '#2E3743', '#8993A4'], ink: '#EDEFF2', font: 'System sans' },
  { id: 'cv',     name: 'U-Design CV Builder', group: 'Aakriti', cat: 'Business', logo: 'cv',
    url: 'https://aakritimarketing.github.io/U-DESIGN-CV/', started: '2026-09-07', completed: '2026-09-10',
    one: 'A CV in under five minutes, rebuilt for every job. No sign-up.',
    long: 'Paste the job description, let any AI chat write, and this page does the formatting, scoring and design.',
    world: 'pages', pal: ['#E9EAE4', '#FFFFFF', '#1E2733', '#2A3543'], ink: '#171B21', font: 'System sans' },
  { id: 'i2p',    name: 'I2P · Image to Prompt', group: 'Aakriti', cat: 'Business', logo: 'i2p',
    url: 'https://aakritimarketing.github.io/I2P-/', started: '2026-09-08', completed: '2026-09-30',
    one: 'Upload a picture, get the prompt that could recreate it.',
    long: 'Wakes ComfyUI and an analysis server on my PC, then writes a ready-made prompt from any image.',
    world: 'crystals', pal: ['#09060F', '#151020', '#C084FC', '#F7F1FF'], ink: '#F7F1FF', font: 'Manrope · DM Mono' },
  { id: 'resto',  name: 'Restaurant Film Brief', group: 'Aakriti', cat: 'Work', logo: 'restaurant',
    url: 'https://aakritimarketing.github.io/RESTAURANT-VIDEO/', started: '2026-09-08', completed: '2026-09-15',
    one: 'Turns a restaurant listing into a shot-by-shot AI video brief in about ten minutes.',
    long: 'Paste a Google listing, pick a cinematic template, and walk away with shot prompts, an asset checklist and a production-ready brief.',
    world: 'mesa', pal: ['#121E26', '#243545', '#D4A96A', '#F5E8D0'], ink: '#F5E8D0', font: 'Cormorant Garamond' },
  { id: 'uweb',   name: 'U-Web Studio',       group: 'Aakriti', cat: 'Business', logo: 'uweb',
    url: 'https://aakritimarketing.github.io/U-Web-Studio-/', started: '2026-10-03', completed: '2026-10-21',
    one: 'Pick a look, tick the features, watch the price move. Websites from AED 650.',
    long: 'Four taps to a new website. Templates from clean classics to award-style 3D sites, requests sent on WhatsApp.',
    world: 'candy', pal: ['#1C1236', '#6A2BFF', '#FFC23D', '#FF5DA2'], ink: '#FFFFFF', font: 'Bricolage Grotesque' },
  { id: 'b2p',    name: 'B2P in Trade',       group: 'Aakriti', cat: 'Business', logo: 'b2p',
    url: 'https://aakritimarketing.github.io/B2P-in-Trade/', started: '2026-09-22', completed: '2026-09-23',
    one: 'A gold trading academy: 18 lectures and a practice terminal that grades every move.',
    long: 'Basic to Pro. Market mechanics, chart reading, risk, macro forces and psychology, then a real-time gold simulator with a demo account.',
    world: 'candles', pal: ['#0A0714', '#1A1030', '#C9A227', '#7B2FF7'], ink: '#FBF8F1', font: 'Lora · Inter' },

  // ---------- U-Design ----------
  { id: 'udesign', name: 'U-Design',          group: 'U-Design', cat: 'Business', logo: 'udesign',
    url: 'https://udesign999-bot.github.io/', started: '2026-07-19', completed: '2026-08-10',
    one: 'The link hub for U-Design: DTF and sublimation printing from Al Ain.',
    long: 'Custom tees, hoodies, mugs and more. This is where every U-Design link lives.',
    world: 'ink', pal: ['#0D0D0D', '#1A1A1A', '#F58529', '#FF8A7A'], ink: '#F0F0F0', font: 'Sora' },
  { id: 'cocoapp', name: 'COCO Pet Care · App', group: 'U-Design', cat: 'Business', logo: 'petapp',
    url: 'https://udesign999-bot.github.io/udesign999-bot.github.io-hamda-/', started: '2026-07-30', completed: '2026-07-30',
    one: 'Your trusted pet care hub. Tap any service.',
    long: 'The COCO pet app: a friendly, green, tap-first home for pet services.',
    world: 'meadow', pal: ['#F0FAF4', '#2ECC71', '#BFEBCF', '#F5A623'], ink: '#1A2E22', font: 'Sora' },
  { id: 'cocodeck', name: 'COCO × U-Design Deck', group: 'U-Design', cat: 'Work', logo: 'petdeck',
    url: 'https://udesign999-bot.github.io/-presentation-coco-pet-care-clinic-/', started: '2026-08-20', completed: '2026-08-20',
    one: 'A clinic pitch for smart QR pet tags, in English and Arabic.',
    long: 'Two ways tags reach pet parents, ten tags to try before you commit. A tiny addition that keeps every client connected.',
    world: 'lagoon', pal: ['#071A1C', '#0D2B2E', '#2DD4BF', '#FFB84D'], ink: '#EAFBF7', font: 'Sora · Cairo' },
  { id: 'vet',    name: 'Family Vet · Al Ain', group: 'U-Design', cat: 'Business', logo: 'vet',
    url: 'https://udesign999-bot.github.io/-AlAin-Vet-1-/', started: '2026-08-06', completed: '2026-09-25',
    one: 'A demo website for a vet clinic in Al Ain: cats, dogs and birds.',
    long: 'Trusted veterinary care, shown as a full demo site that small clinics can have.',
    world: 'islands', pal: ['#081420', '#0D3028', '#14B8A6', '#FF6B4A'], ink: '#E8FBF7', font: 'Sora' },
  { id: 'check',  name: 'Social Media Playbook', group: 'U-Design', cat: 'Work', logo: 'checklist',
    url: 'https://udesign999-bot.github.io/-U-Design-Checklist-/', started: '2026-08-12', completed: '2026-08-12',
    one: 'The weekly AI content system for U-Design and COCO. Prasant + Umair.',
    long: 'A weekly checklist, tick by tick, so posting never depends on mood.',
    world: 'steps', pal: ['#0D0D1A', '#141428', '#FF6B35', '#FF6EB4'], ink: '#FFFFFF', font: 'System sans' },
  { id: 'vintage', name: 'Vintage Hub',       group: 'U-Design', cat: 'Business', logo: 'vintage',
    url: 'https://udesign999-bot.github.io/-Vintage-hub-/', started: '2026-08-15', completed: '2026-08-16',
    one: 'A curated clothes catalogue with a make-your-own-design flow and an admin dashboard.',
    long: 'Curated finds and designs by category, a "create your own design" front and back, orders and an admin side.',
    world: 'spires', pal: ['#0A0D16', '#141A29', '#E2231A', '#EDEEF2'], ink: '#EDEEF2', font: 'Pirata One · Cinzel' },

  // ---------- Prasant ----------
  { id: 'bio',    name: 'Prasant · Portfolio', group: 'Prasant', cat: 'Personal', logo: 'bio',
    url: 'https://tzprasantofficial-ai.github.io/-Prasant-/', started: '2026-08-07', completed: '2026-08-13',
    one: 'The first portfolio: content creator, video editor and AI-driven storyteller.',
    long: 'Origin story, route so far, my people and the cats. The page this story grew out of.',
    world: 'skyline', pal: ['#0B0A10', '#171420', '#FFD02E', '#E93D82'], ink: '#F4EEE2', font: 'Syne · Space Grotesk' },
  { id: 'qr',     name: 'UDesign//QR',        group: 'Prasant', cat: 'Business', logo: 'qrgen',
    url: 'https://tzprasantofficial-ai.github.io/U-DESIGN-QR-/', started: '2026-08-21', completed: '2026-09-08',
    one: 'Free QR codes and barcodes made in your browser. Nothing uploaded, nothing tracked.',
    long: 'No sign-up, no limits, no expiring codes. Old keyboard-wedge scanners can read the 1D barcodes too.',
    world: 'pixels', pal: ['#FFFDF7', '#FF5A45', '#12110F', '#D7FF3E'], ink: '#12110F', font: 'Bungee · Space Grotesk' },
  { id: 'prompter', name: 'Video Core Prompter', group: 'Prasant', cat: 'Business', logo: 'prompter',
    url: 'https://tzprasantofficial-ai.github.io/-trial-/', started: '2026-08-22', completed: '2026-08-22',
    one: 'A standalone product showcase build for poster-style layouts.',
    long: 'A trial poster layout that grew into a clean standalone product showcase.',
    world: 'plinths', pal: ['#1C2530', '#2B3746', '#E8D2A0', '#C0392B'], ink: '#F4EDE0', font: 'Montserrat' },
  { id: 'studio', name: 'Prasant Studio',     group: 'Prasant', cat: 'Work', logo: 'studio',
    url: 'https://tzprasantofficial-ai.github.io/-PRASNTSTUDIO-/', started: '2026-08-11', completed: '2026-09-16',
    one: 'Content creation, printing and QR ventures: my company home page.',
    long: 'Al Ain, UAE. The studio that holds U-Design, Aakriti and the QR ventures under one roof.',
    world: 'dunes', pal: ['#0F0D0B', '#221D18', '#FF5A3C', '#EDE6D8'], ink: '#EDE6D8', font: 'Archivo Black' },
  { id: 'index',  name: 'Site Index',         group: 'Prasant', cat: 'Personal', logo: 'index',
    url: 'https://tzprasantofficial-ai.github.io/Tzprasantofficial-ai/', started: '2026-07-19', completed: '2026-10-03',
    one: 'Every site I have built, in one place, each with its own QR code.',
    long: 'Open, edit or scan: all 24 sites across the Aakriti, U-Design and Prasant accounts.',
    world: 'archipelago', pal: ['#EDEFF6', '#1E45E8', '#7A3FE0', '#141A2B'], ink: '#141A2B', font: 'Archivo · IBM Plex Mono' },
];

/* --- tiny SVG icon set for the workspace logos --------------- */
PKT.icons = {
  pptx: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 21h8M12 16v5"/><path d="M10 8l5 3-5 3z"/>',
  balala: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c4-6 8-6 12-1s4 1 6-3"/>',
  gesture: '<path d="M8 13V6.5a1.5 1.5 0 013 0V11m0-1V4.5a1.5 1.5 0 013 0V11m0-4a1.5 1.5 0 013 0v7a6 6 0 01-6 6h-1a6 6 0 01-5-3l-2-4a1.5 1.5 0 012.5-1.5L8 13"/>',
  pdf: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 14h6M9 17h4"/>',
  bgremove: '<circle cx="6" cy="7" r="2.5"/><circle cx="6" cy="17" r="2.5"/><path d="M8 8.5L20 18M8 15.5L20 6"/>',
  nfc: '<path d="M7 7c3 3 3 7 0 10M11 5c4.5 4.5 4.5 9.5 0 14M15 3c6 6 6 12 0 18"/>',
  inventory: '<path d="M3 8l9-5 9 5v9l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v9"/>',
  cv: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-4 3-6 7-6s7 2 7 6"/>',
  petapp: '<circle cx="7" cy="10" r="1.8"/><circle cx="11" cy="6.5" r="1.8"/><circle cx="16" cy="7" r="1.8"/><circle cx="19" cy="11.5" r="1.8"/><path d="M12 12c3 0 5.5 3.5 5.5 6 0 2-2 2-3 1.5-1-.5-1.5-.7-2.5-.7s-1.5.2-2.5.7c-1 .5-3 .5-3-1.5 0-2.5 2.5-6 5.5-6z"/>',
  petdeck: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M7 20h10M12 16v4M7 12l3-3 3 2 4-4"/>',
  vet: '<path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.7A4.5 4.5 0 0120 10c0 6-8 11-8 11z"/><path d="M12 9v5M9.5 11.5h5"/>',
  udesign: '<path d="M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3c-.5 1.5-2 2.5-4 2.5S8.5 4.5 8 3z"/>',
  checklist: '<path d="M4 6l2 2 3-4M4 14l2 2 3-4M13 7h7M13 15h7"/>',
  vintage: '<path d="M12 6a2 2 0 112 2c0 1-2 1.5-2 3l9 6c1 .7.5 2-.7 2H3.7c-1.2 0-1.7-1.3-.7-2l9-6"/>',
  bio: '<circle cx="12" cy="9" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
  qrgen: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14v1M14 19h2M18 18h3v3"/>',
  prompter: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  studio: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M3 12h18M7 7l3-4M13 7l3-4"/>',
  index: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  i2p: '<rect x="3" y="4" width="12" height="10" rx="1.5"/><path d="M3 11l3-3 4 4M15 17h6m-2-2l2 2-2 2"/>',
  restaurant: '<path d="M3 17h18M5 17a7 7 0 0114 0M12 8V6M10 6h4M3 20h18"/>',
  uweb: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h8M8 17h5"/>',
  b2p: '<path d="M4.5 8h3v8h-3zM6 5v3M6 16v3M10.5 5h3v10h-3zM12 3v2M12 15v4M16.5 10h3v7h-3zM18 7v3M18 17v3"/>',
};
