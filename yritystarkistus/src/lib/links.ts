// Linkit palveluihin, joilla ei ole avointa rajapintaa (tai joiden käyttöehdot
// kieltävät automaattisen haun). Avataan sovelluksen sisäisessä selaimessa
// hakusana valmiiksi täytettynä.

export interface ExternalLink { group: string; label: string; hint: string; url: string }

const q = encodeURIComponent;
const google = (query: string) => `https://www.google.com/search?q=${q(query)}`;

export function companyLinks(ytunnus: string, name: string): ExternalLink[] {
  return [
    { group: 'Viranomaiset', label: 'YTJ – yritystiedot ja verovelka', hint: 'Verovelkarekisteri, toiminimet', url: `https://tietopalvelu.ytj.fi/yritys/${q(ytunnus)}` },
    { group: 'Viranomaiset', label: 'PRH Virre', hint: 'Hallitus, edustajat, tilinpäätökset (osin maksullinen)', url: 'https://virre.prh.fi/novus/home' },
    { group: 'Viranomaiset', label: 'Finanssivalvonta', hint: 'Toimilupa / varoituslista (fintech)', url: google(`site:finanssivalvonta.fi "${name}"`) },
    { group: 'Viranomaiset', label: 'EBA – maksulaitosrekisteri', hint: 'EU:n maksu- ja sähkörahalaitokset', url: 'https://euclid.eba.europa.eu/register/pir/search' },
    { group: 'Talous', label: 'Finder', hint: 'Liikevaihto, tulos, puhelinnumerot', url: `https://www.finder.fi/search?what=${q(ytunnus)}` },
    { group: 'Talous', label: 'Kauppalehti / Asiakastieto', hint: 'Taloustiedot ja luottotiedot', url: google(`${ytunnus} ${name} kauppalehti OR asiakastieto`) },
    { group: 'Maine', label: 'Uutiset', hint: 'Mediamaininnat', url: `https://news.google.com/search?q=${q(`"${name}"`)}&hl=fi&gl=FI&ceid=FI:fi` },
    { group: 'Maine', label: 'Huijausvaroitukset', hint: 'Haku: nimi + huijaus / petos', url: google(`"${name}" huijaus OR petos OR varoitus`) },
    { group: 'Maine', label: 'Pakotelistat (OpenSanctions)', hint: 'Kansainväliset pakotteet ja PEP', url: `https://www.opensanctions.org/search/?q=${q(name)}` },
  ];
}

export function personLinks(name: string): ExternalLink[] {
  return [
    { group: 'Yritysroolit', label: 'PRH Virre – henkilöhaku', hint: 'Hallitus- ja vastuuhenkilöroolit', url: 'https://virre.prh.fi/novus/home' },
    { group: 'Yritysroolit', label: 'Finder – yritykset ja roolit', hint: 'Henkilön yritysroolit', url: `https://www.finder.fi/search?what=${q(name)}` },
    { group: 'Tausta', label: 'Pakotelistat ja PEP (OpenSanctions)', hint: 'Poliittisesti vaikutusvaltaiset henkilöt ja pakotteet', url: `https://www.opensanctions.org/search/?q=${q(name)}` },
    { group: 'Tausta', label: 'Finanssivalvonta', hint: 'Seuraamukset ja varoitukset', url: google(`site:finanssivalvonta.fi "${name}"`) },
    { group: 'Tausta', label: 'Uutiset', hint: 'Mediamaininnat', url: `https://news.google.com/search?q=${q(`"${name}"`)}&hl=fi&gl=FI&ceid=FI:fi` },
    { group: 'Tausta', label: 'Huijausvaroitukset', hint: 'Haku: nimi + huijaus / petos', url: google(`"${name}" huijaus OR petos`) },
  ];
}
