/* Demo data for the OHI client dashboard prototype.
   Everything here is invented for the demo: no real people, phones or businesses. */
window.OHI_DEMO = {
  user: { name: 'Andrei', email: 'andrei@exemplu.ro', role: 'studio' },
  client: { name: 'Ana', email: 'ana@exemplu.ro', siteId: 'salon-ana', agency: 'Studio Andrei' },
  sites: [
    {
      id: 'salon-ana', name: 'Salon Ana', type: 'Salon de înfrumusețare', domain: 'salon-ana.ro', status: 'live', plan: 'Business',
      template: 'Studio', since: '2026-10-02',
      content: {
        heroTitle: 'Tunsori și coafuri făcute cu răbdare',
        heroText: 'Salon în centrul Târgu Mureșului. Programează-te online, în 30 de secunde.',
        about: 'Lucrăm cu programare, ca să nu aștepți. Folosim produse profesionale și îți spunem sincer ce ți se potrivește.',
        phone: '0700 000 001', address: 'Str. Exemplu 12, Târgu Mureș',
        hours: [['Luni – Vineri', '09:00 – 19:00'], ['Sâmbătă', '09:00 – 14:00'], ['Duminică', 'Închis']],
        prices: [['Tuns damă', '80 lei'], ['Tuns bărbați', '50 lei'], ['Coafat', '70 lei'], ['Vopsit', 'de la 150 lei']]
      },
      leads: [
        { id: 'L-1042', name: 'Maria P.', phone: '0700 000 101', what: 'Programare: tuns damă, vineri după 16:00', when: '2026-11-24T10:12', status: 'nou', source: 'Formular programare' },
        { id: 'L-1041', name: 'Ioana D.', phone: '0700 000 102', what: 'Întrebare: aveți loc sâmbătă dimineața pentru vopsit?', when: '2026-11-23T18:40', status: 'nou', source: 'Formular contact' },
        { id: 'L-1039', name: 'Cristina M.', phone: '0700 000 103', what: 'Programare: coafat pentru nuntă, 6 decembrie', when: '2026-11-22T09:05', status: 'sunat', source: 'Formular programare' },
        { id: 'L-1035', name: 'Elena B.', phone: '0700 000 104', what: 'Programare: tuns damă și coafat', when: '2026-11-20T13:22', status: 'client', source: 'Formular programare' },
        { id: 'L-1031', name: 'Raluca T.', phone: '0700 000 105', what: 'Întrebare despre prețul la extensii', when: '2026-11-18T11:47', status: 'inchis', source: 'Formular contact' }
      ],
      visits: [41, 38, 52, 47, 60, 58, 71],
      addons: { form: true, booking: true, prices: true, map: true, langs: false, shop: false, ai: false }
    },
    {
      id: 'pensiunea-valea', name: 'Pensiunea Valea', type: 'Pensiune', domain: 'pensiunea-valea.ro', status: 'preview', plan: 'Business',
      template: 'Natura', since: '2026-11-15',
      content: { heroTitle: 'Liniște, munte și mic dejun de casă', heroText: '6 camere la marginea pădurii. Rezervă direct, fără comision.', about: 'O pensiune de familie.', phone: '0700 000 002', address: 'Sat Exemplu 3, jud. Mureș', hours: [['Recepție', '08:00 – 22:00']], prices: [['Cameră dublă', '280 lei / noapte'], ['Apartament', '420 lei / noapte']] },
      leads: [{ id: 'L-2007', name: 'Familia R.', phone: '0700 000 201', what: 'Rezervare: 2 nopți, 12–14 decembrie, 2 adulți', when: '2026-11-24T08:30', status: 'nou', source: 'Formular rezervare' }],
      visits: [12, 9, 15, 11, 18, 22, 19],
      addons: { form: true, booking: true, prices: true, map: true, langs: true, shop: false, ai: false }
    },
    {
      id: 'atelier-lemn', name: 'Atelier Lemn', type: 'Tâmplărie', domain: 'atelier-lemn.ro', status: 'progress', plan: 'Start',
      template: 'Atelier', since: '2026-11-21',
      content: { heroTitle: 'Mobilier din lemn masiv, la comandă', heroText: 'Mese, bănci și rafturi făcute în atelierul nostru.', about: 'Atelier de familie.', phone: '0700 000 003', address: 'Str. Exemplu 7, Reghin', hours: [['Luni – Vineri', '08:00 – 17:00']], prices: [['Masă 6 persoane', 'de la 2.400 lei']] },
      leads: [], visits: [0, 0, 0, 0, 0, 0, 0],
      addons: { form: true, booking: false, prices: true, map: false, langs: false, shop: false, ai: false }
    }
  ],
  invoices: [
    { no: 'OHI-2026-014', date: '2026-11-01', what: 'Plan lunar · Salon Ana', sum: 'de stabilit', status: 'Plătită' },
    { no: 'OHI-2026-009', date: '2026-10-02', what: 'Site Business · Salon Ana', sum: '1.199 lei', status: 'Plătită' }
  ],
  tickets: [
    { id: 'T-31', title: 'Adăugați o poză nouă în galerie', when: '2026-11-21', status: 'Rezolvat' },
    { id: 'T-35', title: 'Vreau programările și pe WhatsApp', when: '2026-11-23', status: 'În lucru' }
  ]
};
