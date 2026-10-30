# Latentti GPTs - Käyttöohje

**Versio:** 2.0
**Päivitetty:** Joulukuu 2025
**Tekijä:** Ari Hietamäki / Latentti.fi

---

## Mikä on Custom GPT?

Custom GPT on OpenAI:n ChatGPT:ssä räätälöity AI-assistentti, jolla on:
- Oma rooli ja asiantuntemus (esim. strategiakonsultti, talousanalyytikko)
- Valmiit viitekehykset ja metodit
- Johdonmukainen tyyli kaikissa keskusteluissa
- **Erikoisominaisuudet:** Web-haku, koodin suoritus, kuvien luonti, tiedostot

**Hyöty:** Saat asiantuntija-avun ilman, että sinun tarvitsee selittää kontekstia joka kerta uudelleen.

---

## Custom GPT vs. Gemini Gems - Ominaisuusvertailu

Molemmat alustat tarjoavat kattavat ominaisuudet. Tässä vertailu:

### Ominaisuusvertailu

| Ominaisuus | ChatGPT GPT | Gemini Gem | Huomiot |
|------------|:-----------:|:----------:|---------|
| **Code Execution** | ✅ Python | ✅ Python | Molemmat tukevat |
| **File Upload** | ✅ | ✅ | PDF, Excel, Word, CSV |
| **Web Search** | ✅ Web Browsing | ✅ Sisäänrakennettu | Molemmat hakevat netistä |
| **Image Generation** | ✅ DALL-E | ❌ Imagen (rajoitettu) | GPT:ssä parempi |
| **Deep Research** | ❌ | ✅ (10/kk) | Vain Geminissä |
| **Google Workspace** | ⚠️ Actions | ✅ Natiivi (@Gmail, @Drive) | Geminissä parempi |
| **YouTube-analyysi** | ⚠️ Rajoitettu | ✅ @YouTube | Geminissä parempi |
| **Custom Actions/API** | ✅ | ⚠️ Rajoitettu | GPT:ssä parempi |
| **Jakaminen** | ✅ Linkki + GPT Store | ❌ Ei suoraa jakoa | GPT:ssä parempi |
| **Konteksti-ikkuna** | 128K tokens | 1M tokens | Geminissä suurempi |

### Kumpi valita?

**Valitse ChatGPT GPT kun:**
- Tarvitset DALL-E kuvanluontia (markkinointi)
- Haluat jakaa GPT:n helposti muille
- Tarvitset custom API-integraatioita (Actions)
- Käytät jo ChatGPT Plus -tilausta

**Valitse Gemini Gem kun:**
- Käytät Google Workspacea (Gmail, Drive, Docs)
- Tarvitset Deep Research -tutkimuksia
- Haluat analysoida YouTube-videoita
- Käsittelet erittäin pitkiä dokumentteja (1M konteksti)

---

## Custom GPT:n erikoisominaisuudet

### 1. Capabilities (Sisäänrakennetut kyvyt)

| Ominaisuus | Kuvaus | Hyöty |
|------------|--------|-------|
| **Web Browsing** | Reaaliaikainen tiedonhaku internetistä | Ajantasainen kilpailija-analyysi, markkinadata |
| **Code Interpreter & Data Analysis** | Python-koodin suoritus, data-analyysi | Talousmallit, kaaviot, Excel-analyysit |
| **DALL-E Image Generation** | AI-kuvien luonti | Markkinointimateriaalit, kampanjakuvat |

### 2. Knowledge (Tietopohja)

Voit ladata omia tiedostoja GPT:n käyttöön:
- **PDF-dokumentit** - Strategiadokumentit, raportit
- **Excel/CSV** - Talousluvut, asiakasdata
- **Word-dokumentit** - Ohjeistukset, prosessikuvaukset
- **PowerPoint** - Esitysmateriaalit

**Kapasiteetti:** Jopa 256 000 merkkiä ohjeita + useita tiedostoja

### 3. Actions (Ulkoiset integraatiot)

GPT voi yhdistää ulkoisiin palveluihin:
- **Google Drive** - Dokumenttien haku
- **Gmail** - Sähköpostien käsittely
- **GitHub** - Koodirepositoriot
- **SharePoint** - Yrityksen dokumentit
- **Omat API:t** - Integraatio omiin järjestelmiin

### 4. Mallin valinta

Enterprise/Plus-käyttäjät voivat valita mallin:
- **GPT-4o** - Nopea ja tehokas
- **o3 / o4-mini** - Uusimmat mallit
- Eri mallit eri käyttötarkoituksiin

---

## Suositellut ominaisuudet per GPT

| GPT | Web Browsing | Code Interpreter | DALL-E | Knowledge |
|-----|:------------:|:----------------:|:------:|:---------:|
| **Business Strategy Consultant** | **KRIITTINEN** | Suositeltu | - | Suositeltu |
| **Financial Analyst** | Suositeltu | **KRIITTINEN** | - | **KRIITTINEN** |
| **Marketing Strategist** | **KRIITTINEN** | Suositeltu | **KRIITTINEN** | Suositeltu |
| **HR Advisor** | **KRIITTINEN** | Suositeltu | - | **KRIITTINEN** |
| **Myyntimentori** | **KRIITTINEN** | Suositeltu | Valinnainen | Suositeltu |

### Miksi nämä valinnat?

**Business Strategy Consultant:**
- Web Browsing KRIITTINEN → Reaaliaikainen kilpailija- ja markkinatutkimus
- Code Interpreter → Data-analyysi, visualisoinnit
- Knowledge → Yrityksen strategiadokumentit, aiemmat analyysit

**Financial Analyst:**
- Code Interpreter KRIITTINEN → Talousmallit, laskelmat, kaaviot, Excel-analyysit
- Knowledge KRIITTINEN → Tilinpäätökset, budjetit, historialliset luvut
- Web Browsing → Markkinadata, osakehinnat, talousuutiset

**Marketing Strategist:**
- Web Browsing KRIITTINEN → Trendit, kilpailijat, sosiaalinen media
- DALL-E KRIITTINEN → Kampanjakuvat, some-materiaalit, visualisoinnit
- Code Interpreter → Markkinointianalytiikka, dashboardit
- Knowledge → Brändiohjeistukset, kampanjahistoria

**HR Advisor:**
- Web Browsing KRIITTINEN → Finlex-lainsäädäntö, TES-haku, HR-trendit
- Knowledge KRIITTINEN → Yrityksen HR-käsikirja, TES:it, työlainsäädäntö
- Code Interpreter → HR-metriikat, palkka-analyysit, henkilöstödata

---

## Custom GPT:n asentaminen (kerran per GPT)

### Vaihe 1: Avaa ChatGPT
1. Mene osoitteeseen **chat.openai.com**
2. Kirjaudu OpenAI-tililläsi
3. **Huom:** Tarvitset ChatGPT Plus -tilauksen Custom GPT:iden luomiseen

### Vaihe 2: Avaa GPT Builder
1. Klikkaa vasemmasta sivupalkista **Explore GPTs**
2. Klikkaa oikeassa yläkulmassa **+ Create**
3. Valitse **Configure**-välilehti (ei Create-välilehteä)

### Vaihe 3: Määritä GPT
1. **Name:** Anna GPT:lle nimi (esim. "Business Strategy Consultant")
2. **Description:** Kopioi lyhyt kuvaus tiedostosta
3. **Instructions:** Kopioi kaikki ``` merkkien välissä oleva teksti

### Vaihe 4: Lisäasetukset (valinnainen)
1. **Conversation starters:** Lisää esimerkkikysymyksiä (löytyvät tiedostoista)
2. **Capabilities:** Varmista että "Web Browsing" ja "Code Interpreter" ovat päällä tarvittaessa
3. **Knowledge:** Voit lisätä omia tiedostoja GPT:n käyttöön

### Vaihe 5: Tallenna
1. Klikkaa **Save** oikeassa yläkulmassa
2. Valitse **Only me** (yksityinen) tai **Anyone with a link** (jaettava)
3. GPT on nyt käyttövalmis!

---

## Custom GPT:n käyttäminen (päivittäin)

### Aloita keskustelu
1. Klikkaa vasemmasta sivupalkista **My GPTs**
2. Valitse haluamasi GPT
3. Kirjoita pyyntösi normaalisti

### Esimerkkejä keskustelun aloituksesta

**Business Strategy Consultant:**
- "Analyze the competitive landscape for [toimiala]"
- "Help me develop a market entry strategy for [markkina]"
- "Conduct a SWOT analysis for [yritys]"

**Financial Analyst:**
- "Create a 3-year financial projection for [yritys]"
- "Analyze the unit economics of [liiketoimintamalli]"
- "Calculate the valuation of [yritys] using DCF"

**Marketing Strategist:**
- "Develop a go-to-market strategy for [tuote]"
- "Help me define customer segments for [palvelu]"
- "Create a growth strategy to scale from X to Y customers"

**HR Advisor:**
- "Suunnittele perehdytysohjelma uusille työntekijöille"
- "Miten toteutetaan YT-neuvottelut oikein?"
- "Laadi suorituksen johtamisen järjestelmä OKR-mallilla"
- "Analysoi henkilöstön vaihtuvuutta ja ehdota toimenpiteitä"

### Vinkkejä tehokkaaseen käyttöön

| Vinkki | Esimerkki |
|--------|-----------|
| **Anna konteksti** | "We are a B2B SaaS company with 50 employees..." |
| **Määritä tavoite** | "I need this for investor presentation" |
| **Pyydä tiettyä viitekehystä** | "Use Porter's Five Forces to analyze..." |
| **Pyydä formaattia** | "Present this as a table" / "Give me bullet points" |

---

## Saatavilla olevat GPT:t

| GPT | Tiedosto | Käyttötarkoitus |
|-----|----------|-----------------|
| **Business Strategy Consultant** | `Business-Strategy-Consultant-GPT.md` | Strateginen suunnittelu, kilpailija-analyysi, SWOT, Porter's Five Forces |
| **Financial Analyst** | `Financial-Analyst-GPT.md` | Talousennusteet, arvonmääritys, unit economics, ROI-analyysi |
| **Marketing Strategist** | `Marketing-Strategist-GPT.md` | Go-to-market, growth hacking, brand positioning, AARRR-metriikat |
| **HR Advisor** | `HR-Advisor-GPT.md` | Henkilöstöstrategia, suorituksen johtaminen, työlainsäädäntö, TES, organisaation kehittäminen |
| **Myyntimentori** | `Myyntimentori-GPT.md` + `myyntimentori/index.html` | Asiakassuhteen rakentaminen 10 vaiheessa, DISC-persoonat, valmiit WhatsApp-/sähköpostiviestit, visiotarinat, vastaväitteet. Mukana selainsovellus. |

---

## Usein kysytyt kysymykset

### Kuinka monta GPT:tä voin luoda?
ChatGPT Plus -tilauksella voit luoda useita GPT:itä. Jokainen toimii itsenäisesti.

### Muistaako GPT aiemmat keskustelut?
GPT muistaa keskustelun sisällä, mutta jokainen uusi keskustelu alkaa puhtaalta pöydältä. GPT kuitenkin noudattaa aina samoja ohjeita.

### Voinko muokata GPT:tä?
Kyllä. Avaa GPT → **Edit GPT** (kolme pistettä -valikosta) → muokkaa ohjeita → **Save**.

### Miksi GPT ei noudata ohjeita?
- Kokeile antaa selkeämpi pyyntö
- Pyydä eksplisiittisesti: "Use [framework] to analyze this"
- Tarkista, että ohjeet kopioituivat kokonaan

### Voinko jakaa GPT:n muille?
Kyllä! Tallennusvaiheessa valitse **Anyone with a link** ja jaa linkki. Voit myös julkaista GPT:n GPT Storessa.

### Mikä ero on Geminin Gemeihin?
Molemmat tarjoavat samat perusominaisuudet (Code Execution, File Upload, Web Search). Erot:
- **GPT:ssä parempi:** DALL-E kuvanluonti, jakaminen, Custom Actions
- **Geminissä parempi:** Deep Research, Google Workspace -integraatio, @YouTube
- Ohjeiden sisältö on yhteensopiva - voit käyttää samaa pohjaa molemmissa

---

## Ongelmanratkaisu

| Ongelma | Ratkaisu |
|---------|----------|
| GPT ei vastaa odotetulla tavalla | Pyydä eksplisiittisesti haluamaasi viitekehystä tai formaattia |
| Vastaukset liian pitkiä | Lisää pyyntöön: "Be concise" tai "Max 3 bullet points" |
| GPT ei käytä oikeaa kieltä | Kirjoita pyyntösi haluamallasi kielellä |
| GPT unohtaa aiemman keskustelun | Tämä on normaalia - muistuta tärkeät asiat uudessa viestissä |
| "Custom GPTs" ei näy | Varmista että sinulla on ChatGPT Plus -tilaus |

---

## Resurssit

- [ChatGPT](https://chat.openai.com)
- [OpenAI GPT Builder Guide](https://help.openai.com/en/articles/8554397-creating-a-gpt)
- [GPT Store](https://chat.openai.com/gpts)

---

*Latentti.fi - AI-avusteinen liiketoiminnan kehittäminen*
